import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Text,
  Flex,
  Heading,
  Divider,
  LightMode,
} from "@chakra-ui/react";
import RHFFormProvider from "@/components/hook-form/RHFFormProvider";

import { NICHES } from "@/constants/niches";
import { CONTENT_TYPES } from "@/constants/contentTypes";
import {
  calculateRate,
  calculateBaseRate,
  calculateEngagementMultiplier,
  calculateEngagementRate,
  finalizeRate,
  formatFloor,
  DEFAULT_ER_BENCHMARK,
} from "@/constants/formulas";

import RHFSingleFileUpload from "@/components/hook-form/RHFSingleFileUpload";
import RHFInput from "@/components/hook-form/RHFInput";
import RHFNumberInput from "@/components/hook-form/RHFNumberInput";
import RHFSelect from "@/components/hook-form/RHFSelect";

import { FaTiktok, FaXmark } from "react-icons/fa6";
import HomeLayout from "@/Layouts/HomePageLayout";
import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";

const formatIDR = (value) =>
  `Rp ${Math.round(Number(value) || 0).toLocaleString("id-ID")}`;

/**
 * Rule untuk field angka. Sengaja tidak pakai `required` bawaan RHF supaya
 * `0` tetap dianggap nilai sah — `required` memperlakukan nilai falsy sebagai
 * kosong, dan itu bikin "Total Shares: 0" tidak bisa disubmit.
 */
const numberRule = (label, { min = 0 } = {}) => ({
  validate: (value) => {
    if (value === "" || value === undefined || value === null) {
      return `${label} wajib diisi`;
    }
    if (value < min) return `${label} minimal ${min}`;
    return true;
  },
});

TikTok.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function TikTok() {
  const [results, setResults] = useState(null);
  const methods = useForm({
    defaultValues: {
      fullName: "",
      tiktokUsername: "",
      displayPicture: null,
      analyticsScreenshot: null,
      dataPeriod: "14 hari terakhir",
      totalViews: "",
      totalLikes: "",
      totalComments: "",
      totalShares: "",
      niche: "",
      videoCount: 1,
    },
    mode: "onSubmit",
  });

  const onSubmit = (data) => {
    const nicheConfig = NICHES.find((n) => n.id === data.niche);
    if (!nicheConfig) return;

    const totalViews = Number(data.totalViews);
    const videoCount = Math.max(Number(data.videoCount) || 1, 1);

    // `totalViews` adalah tayangan sepanjang periode, bukan per konten. Tarif
    // dihitung untuk SATU deliverable, jadi pakai views per konten — kalau
    // tidak, tarif per konten dihitung dari views seluruh periode lalu dikali
    // jumlah konten lagi saat menampilkan total.
    const viewsPerContent = totalViews / videoCount;

    // ER dihitung dari total periode. Secara matematis sama dengan ER rata-rata
    // per konten, jadi tidak perlu dibagi videoCount.
    const engagementRate = calculateEngagementRate({
      views: totalViews,
      likes: data.totalLikes,
      comments: data.totalComments,
      shares: data.totalShares,
    });

    const tiktokCpm = nicheConfig.platformCPMs.tiktok;

    // CPM per format adalah acuan tunggal — `cpmRef` di contentTypes menunjuk
    // key yang tepat, jadi jangan ada bobot per-format tambahan.
    const rateFor = (cpm, durationMultiplier = 1) =>
      calculateRate({
        impressions: viewsPerContent,
        cpm,
        engagementRate,
        nicheERBenchmark: DEFAULT_ER_BENCHMARK,
        nicheMultiplier: nicheConfig.engagementMultiplier,
        durationMultiplier,
      });

    const contentTypes = CONTENT_TYPES.tiktok
      .map((ct) => {
        const cpm = tiktokCpm[ct.cpmRef];
        if (!cpm) return null;

        // Floor ikut CPM format, supaya di volume rendah harga antar format
        // tidak menempel semuanya di satu angka.
        const floor = formatFloor(cpm, tiktokCpm.video);
        const rawRate = rateFor(cpm);
        const rate = finalizeRate(rawRate, floor);
        return {
          id: ct.id,
          label: ct.label,
          description: ct.description,
          cpm,
          floor,
          rate,
          durations: (ct.durationOptions || []).map((dur) => ({
            label: dur.label,
            rate: finalizeRate(rawRate * dur.multiplierExtra, floor),
          })),
        };
      })
      .filter(Boolean);

    const primary =
      contentTypes.find((ct) => ct.id === "shortVideo") ?? contentTypes[0];

    setResults({
      niche: nicheConfig.label,
      totalViews,
      viewsPerContent,
      videoCount,
      engagementRate,
      engagementMult: calculateEngagementMultiplier(
        engagementRate,
        DEFAULT_ER_BENCHMARK,
      ),
      nicheMultiplier: nicheConfig.engagementMultiplier,
      baseRate: calculateBaseRate(viewsPerContent, primary.cpm),
      cpm: primary.cpm,
      ratePerVideo: primary.rate,
      contentTypes,
    });
  };

  const handleReset = () => {
    methods.reset();
    setResults(null);
  };

  const nicheOptions = NICHES.map((n) => ({
    value: n.id,
    label: n.label,
  }));

  // Hint live: perlihatkan pembagian total views dengan jumlah konten sebelum
  // submit, supaya jelas bahwa metrik di Bagian 2 adalah total periode.
  // `useWatch`, bukan `methods.watch()` — yang kedua tidak kompatibel dengan
  // React Compiler (rule react-hooks/incompatible-library).
  const watchedViews =
    Number(useWatch({ control: methods.control, name: "totalViews" })) || 0;
  const watchedCount = Math.max(
    Number(useWatch({ control: methods.control, name: "videoCount" })) || 1,
    1,
  );
  const viewsPerContentHint =
    watchedViews > 0
      ? `${watchedViews.toLocaleString("id-ID")} views ÷ ${watchedCount} konten = ${Math.round(
          watchedViews / watchedCount,
        ).toLocaleString(
          "id-ID",
        )} views/konten. Tarif dihitung dari angka per konten ini.`
      : "Jumlah konten yang di-post dalam periode yang sama. Total views di Bagian 2 akan dibagi angka ini.";

  return (
    <RHFFormProvider
      methods={methods}
      onSubmit={methods.handleSubmit(onSubmit)}
    >
      {/* Halaman ini memakai band terang, jadi semua token di sini adalah varian
          `*Inverse` — `fg`, `surface`, `border`, dan `bg` polos adalah varian
          band gelap.

          `<LightMode>` wajib: theme.js menyetel initialColorMode "dark", jadi
          tanpa ini komponen bawaan Chakra (Input, Select, NumberInput) merender
          varian gelap — bg dan border-nya whiteAlpha di atas halaman putih,
          praktis tidak kelihatan. */}
      <LightMode>
        <Box bg="bgInverse" color="fgInverse" minH="100vh" py={12}>
          <Container maxW="container.xl">
            <Box mb={8} textAlign="center">
              <Heading as="h1" size="xl" mb={2}>
                TikTok Rate Card Calculator
              </Heading>
              <Text color="mutedInverse" fontSize="lg">
                Hitung estimasi harga konten TikTok Anda berdasarkan data
                analytics.
              </Text>
            </Box>

            <Box
              bg="surfaceInverse"
              borderWidth="1px"
              borderColor="borderInverse"
              borderRadius="card"
              p={8}
            >
              <Box mb={8}>
                <Heading size="md" color="fgInverse" mb={4}>
                  Bagian 1: Identitas Akun
                </Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={6}
                >
                  <RHFInput
                    name="fullName"
                    label="Nama Lengkap"
                    placeholder="Nama asli kreator"
                    isRequired
                    rules={{ required: "Nama lengkap wajib diisi" }}
                  />
                  <RHFInput
                    name="tiktokUsername"
                    label="Username TikTok"
                    placeholder="@username"
                    isRequired
                    rules={{ required: "Username TikTok wajib diisi" }}
                  />
                  <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                    <RHFSingleFileUpload
                      name="displayPicture"
                      label="Display Picture / Foto Profil (opsional)"
                      typeFile={["image"]}
                      helperText="Upload foto profil TikTok Anda (JPG, PNG)."
                    />
                  </Box>
                </Grid>
              </Box>

              <Divider borderColor="borderInverse" my={8} />

              <Box mb={8}>
                <Heading size="md" color="fgInverse" mb={4}>
                  Bagian 2: Data Engagement
                </Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={6}
                >
                  <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                    <RHFSingleFileUpload
                      name="analyticsScreenshot"
                      label="Upload Screenshot TikTok Analytics (opsional)"
                      typeFile={["image"]}
                      helperText="Upload screenshot analytics TikTok Anda untuk referensi."
                    />
                  </Box>
                  <RHFInput
                    name="dataPeriod"
                    label="Periode Data"
                    placeholder="14 hari terakhir"
                    isRequired
                    rules={{ required: "Periode data wajib diisi" }}
                  />
                  <RHFNumberInput
                    name="totalViews"
                    label="Total Views — Semua Konten"
                    placeholder="0"
                    isRequired
                    min={0}
                    rules={numberRule("Total views", { min: 1 })}
                    helperText="Jumlah tayangan SELURUH konten dalam periode ini, bukan per konten. Angka ini nanti dibagi jumlah konten di Bagian 3."
                  />
                  <RHFNumberInput
                    name="totalLikes"
                    label="Total Likes — Semua Konten"
                    placeholder="0"
                    isRequired
                    min={0}
                    rules={numberRule("Total likes")}
                    helperText="Jumlah like dari seluruh konten dalam periode ini."
                  />
                  <RHFNumberInput
                    name="totalComments"
                    label="Total Comments — Semua Konten"
                    placeholder="0"
                    isRequired
                    min={0}
                    rules={numberRule("Total comments")}
                    helperText="Jumlah komentar dari seluruh konten dalam periode ini."
                  />
                  <RHFNumberInput
                    name="totalShares"
                    label="Total Shares — Semua Konten"
                    placeholder="0"
                    isRequired
                    min={0}
                    rules={numberRule("Total shares")}
                    helperText="Jumlah share dari seluruh konten dalam periode ini."
                  />
                </Grid>
              </Box>

              <Divider borderColor="borderInverse" my={8} />

              <Box mb={8}>
                <Heading size="md" color="fgInverse" mb={4}>
                  Bagian 3: Parameter Kalkulasi
                </Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={6}
                >
                  <RHFSelect
                    name="niche"
                    label="Niche / Kategori Konten"
                    placeholderValue="Pilih niche"
                    isRequired
                    bg="white"
                    color="black"
                    options={nicheOptions}
                    rules={{ required: "Niche wajib dipilih" }}
                  />
                  <RHFNumberInput
                    name="videoCount"
                    label="Jumlah Konten dalam Periode"
                    placeholder="1"
                    isRequired
                    min={1}
                    rules={numberRule("Jumlah konten", { min: 1 })}
                    helperText={viewsPerContentHint}
                  />
                </Grid>
              </Box>

              <Box mt={8} mb={8} textAlign="center">
                <Button
                  type="submit"
                  colorScheme="pink"
                  size="lg"
                  px={10}
                  py={3}
                >
                  <FaTiktok style={{ marginInlineEnd: "0.5rem" }} />
                  Hitung Rate Card
                </Button>
              </Box>
            </Box>

            {results && (
              <Box
                bg="surfaceInverse"
                borderWidth="1px"
                borderColor="borderInverse"
                borderRadius="card"
                p={8}
                mt={8}
              >
                <Heading size="lg" color="fgInverse" mb={6} textAlign="center">
                  Hasil Perhitungan Rate Card TikTok
                </Heading>

                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={6}
                  mb={8}
                >
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      Niche
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {results.niche}
                    </Text>
                  </Box>
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      Total Views (semua konten)
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {results.totalViews.toLocaleString("id-ID")}
                    </Text>
                    <Text color="mutedInverse" fontSize="xs">
                      {Math.round(results.viewsPerContent).toLocaleString(
                        "id-ID",
                      )}{" "}
                      per konten ({results.videoCount} konten) — dasar
                      perhitungan tarif
                    </Text>
                  </Box>
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      Engagement Rate (periode)
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {results.engagementRate.toFixed(2)}%
                    </Text>
                    <Text color="mutedInverse" fontSize="xs">
                      total interaksi ÷ total views periode
                    </Text>
                  </Box>
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      CPM Acuan (Video)
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {formatIDR(results.cpm)} / 1000 views
                    </Text>
                    <Text color="mutedInverse" fontSize="xs">
                      base rate {formatIDR(results.baseRate)} sebelum multiplier
                    </Text>
                  </Box>
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      Multiplier Engagement
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {results.engagementMult.toFixed(2)}x
                    </Text>
                    <Text color="mutedInverse" fontSize="xs">
                      benchmark {DEFAULT_ER_BENCHMARK}%
                    </Text>
                  </Box>
                  <Box>
                    <Text color="mutedInverse" fontSize="sm">
                      Multiplier Niche
                    </Text>
                    <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                      {results.nicheMultiplier}x
                    </Text>
                  </Box>
                </Grid>

                <Divider borderColor="borderInverse" my={6} />

                <Heading size="md" color="fgInverse" mb={4}>
                  Estimasi Harga per Content Type
                </Heading>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={4}
                >
                  {results.contentTypes.map((ct) => (
                    <Box
                      key={ct.id}
                      bg="bgInverse"
                      borderWidth="1px"
                      borderColor="borderInverse"
                      borderRadius="card"
                      p={4}
                    >
                      <Text color="fgInverse" fontWeight="bold" fontSize="md">
                        {ct.label}
                      </Text>
                      <Text color="mutedInverse" fontSize="sm" mt={1}>
                        {ct.description}
                      </Text>
                      <Box mt={3}>
                        <Text color="mutedInverse" fontSize="xs">
                          Harga per konten
                        </Text>
                        <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                          {formatIDR(ct.rate)}
                        </Text>
                        <Text color="mutedInverse" fontSize="xs" mt={1}>
                          CPM {formatIDR(ct.cpm)}/1000 views · minimum{" "}
                          {formatIDR(ct.floor)}
                        </Text>
                      </Box>
                      {ct.durations.length > 0 && (
                        <Box mt={2}>
                          <Text
                            color="mutedInverse"
                            fontSize="xs"
                            textTransform="uppercase"
                          >
                            Breakdown per durasi
                          </Text>
                          {ct.durations.map((dur) => (
                            <Flex
                              key={dur.label}
                              justify="space-between"
                              mt={1}
                            >
                              <Text color="mutedInverse" fontSize="sm">
                                {dur.label}
                              </Text>
                              <Text color="fgInverse" fontSize="sm">
                                {formatIDR(dur.rate)}
                              </Text>
                            </Flex>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Grid>

                <Divider borderColor="borderInverse" my={6} />

                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={6}
                >
                  <Box
                    bg="accent.purple"
                    p={4}
                    borderRadius="card"
                    textAlign="center"
                  >
                    <Text color="white" fontSize="xs" textTransform="uppercase">
                      Konten dalam Periode
                    </Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {results.videoCount}
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1}>
                      dasar pembagian data analytics
                    </Text>
                  </Box>
                  <Box
                    bg="accent.pink"
                    p={4}
                    borderRadius="card"
                    textAlign="center"
                  >
                    <Text color="white" fontSize="xs" textTransform="uppercase">
                      Views per Konten
                    </Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {Math.round(results.viewsPerContent).toLocaleString(
                        "id-ID",
                      )}
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1}>
                      total views ÷ jumlah konten
                    </Text>
                  </Box>
                  <Box
                    bg="accent.blue"
                    p={4}
                    borderRadius="card"
                    textAlign="center"
                  >
                    <Text color="white" fontSize="xs" textTransform="uppercase">
                      Harga per Konten
                    </Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {formatIDR(results.ratePerVideo)}
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="xs" mt={1}>
                      format video, satuan
                    </Text>
                  </Box>
                </Grid>

                <Box mt={4} textAlign="center">
                  <Text color="mutedInverse" fontSize="xs">
                    Harga di atas berlaku per satu konten. Jumlah konten dalam
                    periode hanya dipakai untuk membagi data analytics — bukan
                    jumlah konten yang dipesan.
                  </Text>
                </Box>

                <Box mt={6} textAlign="center">
                  <Button
                    onClick={handleReset}
                    colorScheme="gray"
                    variant="outline"
                  >
                    <FaXmark style={{ marginInlineEnd: "0.5rem" }} />
                    Hitung Ulang
                  </Button>
                </Box>
              </Box>
            )}
          </Container>
        </Box>
      </LightMode>
    </RHFFormProvider>
  );
}
