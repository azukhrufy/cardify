import { useForm, useWatch } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Image,
  DarkMode,
  Avatar,
  IconButton,
  useToast,
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

import PageMeta from "@/components/PageMeta";

import RHFSingleFileUpload from "@/components/hook-form/RHFSingleFileUpload";
import RHFInput from "@/components/hook-form/RHFInput";
import RHFNumberInput from "@/components/hook-form/RHFNumberInput";
import RHFSelect from "@/components/hook-form/RHFSelect";

import { FaTiktok, FaXmark } from "react-icons/fa6";
import HomeLayout from "@/Layouts/HomePageLayout";
import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import Wordmark from "@/components/Wordmark";
import { SITE_URL } from "@/components/Seo";
import {
  exportElementToPdf,
  sanitizePdfFilename,
} from "@/utils/exportElementToPdf";
import { FiDownload } from "react-icons/fi";
import { TikTokLogo } from "@/components/CalcHero";
import { FaUsers } from "react-icons/fa";

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
      dataPeriod: "",
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
      displayPicture: data.displayPicture,
      fullName: data.fullName,
      username: data.tiktokUsername,
      dataPeriod: data?.dataPeriod,
      totalFollowers: data.totalFollowers,
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

  // --- Unduh PDF ---------------------------------------------------------
  // Hasil di-capture jadi raster (html2canvas), jadi <a href> watermark tidak
  // ikut jadi link; helper menambal ulang dengan anotasi PDF yang bisa diklik.
  const [isExporting, setIsExporting] = useState(false);
  // Guard re-entrancy sinkron: state `isExporting` belum flush saat klik kedua
  // di tick yang sama masuk.
  const exportLockRef = useRef(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const toast = useToast();

  useEffect(() => {
    // Set ulang di body, bukan cuma di cleanup: StrictMode (next.config.mjs
    // `reactStrictMode`) menjalankan effect mount → cleanup → mount di dev, dan
    // kalau cuma di-clear, flag-nya nyangkut false selamanya.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort(); // hentikan render html2canvas yang sedang jalan
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setIsExporting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const element = document.getElementById("tiktok-results");
      if (!element) throw new Error("Blok hasil belum dirender.");

      // `results.username` itu isian mentah field `tiktokUsername`, belum
      // divalidasi apa pun — jadi wajib disanitasi sebelum jadi nama file.
      const name =
        sanitizePdfFilename(results?.username) ||
        sanitizePdfFilename(results?.fullName) ||
        "creator";

      // Helper-nya memaksa lebar viewport clone ke ukuran desktop, jadi PDF yang
      // keluar selalu layout 2/3 kolom walau tombolnya ditekan dari HP. Anotasi
      // watermark diukur ulang di dalam iframe clone, bukan di layout HP ini.
      await exportElementToPdf(element, {
        filename: `Rate Card Tiktok ${name}.pdf`,
        linkSelectors: ["#document-watermark"],
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") return; // unmount saat proses: diamkan
      console.error("[tiktok] PDF export failed", error);
      if (mountedRef.current) {
        toast({
          title: "Gagal membuat PDF",
          description:
            "Gambar hasil perhitungan tidak bisa diproses. Coba lagi sebentar lagi.",
          status: "error",
          duration: 6000,
          isClosable: true,
        });
      }
    } finally {
      abortRef.current = null;
      exportLockRef.current = false;
      setIsExporting(false);
    }
  }, [results, toast]);

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
  const watchedDataPeriod =
    useWatch({ control: methods.control, name: "dataPeriod" }) || "";
  const viewsPerContentHint =
    watchedViews > 0
      ? `${watchedViews.toLocaleString("id-ID")} views ÷ ${watchedCount} konten = ${Math.round(
          watchedViews / watchedCount,
        ).toLocaleString(
          "id-ID",
        )} views/konten. Tarif dihitung dari angka per konten ini.`
      : "Jumlah konten yang di-post dalam periode yang sama. Total views di Bagian 2 akan dibagi angka ini.";

  return (
    <>
      <PageMeta title="Tiktok Calculator" />
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
                  {results
                    ? "Hasil Perhitungan Rate Card TikTok"
                    : "TikTok Rate Card Calculator"}
                </Heading>
                <Text color="mutedInverse" fontSize="lg">
                  Hitung estimasi harga konten TikTok Anda berdasarkan data
                  analytics.
                </Text>
              </Box>

              {!results && (
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
                        <RHFNumberInput
                          name="totalFollowers"
                          label="Total Followers"
                          placeholder="0"
                          isRequired
                          min={0}
                          rules={numberRule("Total followers", { min: 1 })}
                        />
                      </Box>
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
                      <RHFSelect
                        name="dataPeriod"
                        label="Periode Data"
                        placeholder="Pilih periode data"
                        bg="white"
                        options={[
                          { value: "7", label: "7 hari terakhir" },
                          { value: "14", label: "14 hari terakhir" },
                          { value: "30", label: "30 hari terakhir" },
                        ]}
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
                        label={`Jumlah Konten dalam ${watchedDataPeriod ? `${watchedDataPeriod} hari terakhir` : "Periode Ini"}`}
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
              )}

              {results && (
                <Box
                  id="tiktok-results"
                  bg="surfaceInverse"
                  borderWidth="1px"
                  borderColor="borderInverse"
                  borderRadius="2xl"
                  overflow="hidden"
                  p={8}
                  mt={8}
                >
                  <Box
                    bg="tiktokBlack.500"
                    mt={-8}
                    mx={-8}
                    p={10}
                    position="relative"
                  >
                    <DarkMode>
                      <Grid
                        gridGap={10}
                        templateColumns={{base: '1fr',lg:"max-content 1fr"}}
                        alignItems="center"
                      >
                        <Box position="relative" w='max-content' h='max-content'>
                          <Box
                            rounded="full"
                            overflow="hidden"
                            w={{base:'10ch',lg:"25ch"}}
                            h={{base:'10ch',lg:"25ch"}}
                          >
                            {results?.displayPicture ? (
                              <Image
                                src={results?.displayPicture}
                                alt="Display Picture"
                                objectFit="cover"
                              />
                            ) : (
                              <TikTokLogo />
                            )}
                          </Box>
                          <IconButton
                            icon={<FaTiktok />}
                            colorScheme="tiktokBlack"
                            aria-label="TikTok"
                            position="absolute"
                            bottom="0"
                            right="0"
                            size={{base:'xs',lg:'md'}}
                          />
                        </Box>
                        <Box>
                          <Text
                            as="h1"
                            fontSize="4xl"
                            fontWeight="bold"
                            color="bgInverse"
                          >
                            {results.fullName}
                          </Text>
                          <Text
                            color="muted"
                            as="h1"
                            fontSize="2xl"
                            fontWeight="bold"
                          >
                            {results.username}
                          </Text>
                          <Button leftIcon={<FaUsers />} mt={2}>
                            {results?.totalFollowers.toLocaleString("id-ID")}{" "}
                            Followers
                          </Button>
                        </Box>
                      </Grid>
                    </DarkMode>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={handleDownloadPdf}
                      isLoading={isExporting}
                      data-html2canvas-ignore="true"
                      position="absolute"
                      top="5"
                      right="5"
                    >
                      Unduh PDF
                    </Button>
                  </Box>

                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={6}
                    mb={8}
                    mt={8}
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
                        base rate {formatIDR(results.baseRate)} sebelum
                        multiplier
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
                          <Text
                            color="fgInverse"
                            fontWeight="bold"
                            fontSize="lg"
                          >
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
                      <Text
                        color="white"
                        fontSize="xs"
                        textTransform="uppercase"
                      >
                        Konten dalam {results?.dataPeriod} Hari Terakhir
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
                      <Text
                        color="white"
                        fontSize="xs"
                        textTransform="uppercase"
                      >
                        Rata - Rata Views per Konten
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
                      <Text
                        color="white"
                        fontSize="xs"
                        textTransform="uppercase"
                      >
                        Estimasi Harga per Konten
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
                      id="document-watermark"
                      // `as="a"`: tanpa ini Chakra merender <button href="...">,
                      // dan href di <button> cuma atribut mati — diklik tidak ke
                      // mana-mana. Helper PDF membaca href yang sudah di-resolve
                      // browser dari anchor ini.
                      as="a"
                      href={SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      colorScheme="tiktokBlack"
                    >
                      <Box>
                        <Text fontSize="sm">Made with </Text>
                        <Wordmark />
                      </Box>
                    </Button>
                  </Box>
                </Box>
              )}
            </Container>
            {results && (
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
            )}
          </Box>
        </LightMode>
      </RHFFormProvider>
    </>
  );
}
