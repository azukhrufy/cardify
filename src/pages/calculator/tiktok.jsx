import { useForm, FormProvider } from "react-hook-form";
import { Box, Button, Container, Grid, Text, Select, Flex, Heading, Divider, VStack, useRouter } from "@chakra-ui/react";
import NextLink from "next/link";

import { NICHES } from "@/constants/niches";
import { CONTENT_TYPES } from "@/constants/contentTypes";
import { calculateRate, calculateBaseRate, calculateEngagementMultiplier } from "@/constants/formulas";

import RHFSingleFileUpload from "@/components/hook-form/RHFSingleFileUpload";
import RHFInput from "@/components/hook-form/RHFInput";
import RHFNumberInput from "@/components/hook-form/RHFNumberInput";

import { FaTiktok, FaInstagram, FaYoutube, FaUpload, FaTimes } from "react-icons/fa6";

const TIKTOK_DURATION_OPTIONS = CONTENT_TYPES.tiktok.find(ct => ct.id === 'shortVideo')?.durationOptions || [];

export default function TikTok() {
  const router = useRouter();
  const methods = useForm({
    defaultValues: {
      fullName: "",
      tiktokUsername: "",
      displayPicture: null,
      analyticsScreenshot: null,
      dataPeriod: "14 hari terakhir",
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      niche: "",
      videoCount: 1,
      carouselImageCount: null,
      packageQuantity: null,
    },
    mode: "onSubmit",
  });

  const onSubmit = (data) => {
    const engagementRate = data.totalViews > 0
      ? ((data.totalLikes + data.totalComments + data.totalShares) / data.totalViews) * 100
      : 0;

    const nicheConfig = NICHES.find(n => n.id === data.niche);
    if (!nicheConfig) return;

    const cpm = nicheConfig.platformCPMs.tiktok.video;
    const baseRate = calculateBaseRate(data.totalViews, cpm);
    const engagementMult = calculateEngagementMultiplier(engagementRate, 5.0);
    const contentTypeMult = nicheConfig.contentTypeMultipliers.shortVideo || 1.0;
    const ratePerVideo = baseRate * engagementMult * contentTypeMult;
    const totalRate = ratePerVideo * (data.videoCount || 1);

    const results = {
      engagementRate,
      baseRate,
      engagementMult,
      contentTypeMult,
      ratePerVideo,
      totalRate,
      videoCount: data.videoCount,
      niche: nicheConfig.label,
      cpm,
      totalViews: data.totalViews,
      totalLikes: data.totalLikes,
      totalComments: data.totalComments,
      totalShares: data.totalShares,
      contentTypes: CONTENT_TYPES.tiktok.map(ct => {
        const ctMult = nicheConfig.contentTypeMultipliers[ct.multiplierRef] || 1.0;
        const ctRate = baseRate * engagementMult * ctMult;
        return {
          ...ct,
          rate: ctRate,
          totalRate: ctRate * (data.videoCount || 1),
        };
      }),
    };

    window.__tiktokCalcResults = results;
    router.push("/calculator/tiktok?results=1");
  };

  const results = window.__tiktokCalcResults || null;

  const nicheOptions = NICHES.map(n => ({
    value: n.id,
    label: n.label,
  }));

  return (
    <FormProvider {...methods}>
      <Box bg="bg" minH="100vh" py={12}>
        <Container maxW="container.xl">
          <Box mb={8} textAlign="center">
            <Box mb={4}>
              <FaTiktok size={48} color="#FE2C55" />
            </Box>
            <Heading size="xl" color="fg" mb={2}>
              TikTok Rate Card Calculator
            </Heading>
            <Text color="muted" fontSize="lg">
              Hitung estimasi harga konten TikTok Anda berdasarkan data analytics.
            </Text>
          </Box>

          <Box
            as="form"
            onSubmit={methods.handleSubmit(onSubmit)}
            bg="surface"
            borderWidth="1px"
            borderColor="border"
            borderRadius="card"
            p={8}
          >
            <Box mb={8}>
              <Heading size="md" color="fg" mb={4}>
                Bagian 1: Identitas Akun
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <RHFInput
                  name="fullName"
                  label="Nama Lengkap"
                  placeholder="Nama asli kreator"
                  isRequired
                />
                <RHFInput
                  name="tiktokUsername"
                  label="Username TikTok"
                  placeholder="@username"
                  isRequired
                />
                <Box colSpan={{ base: "1fr", md: "2fr" }}>
                  <RHFSingleFileUpload
                    name="displayPicture"
                    label="Display Picture / Foto Profil (opsional)"
                    typeFile={["image"]}
                    helperText="Upload foto profil TikTok Anda (JPG, PNG)."
                  />
                </Box>
              </Grid>
            </Box>

            <Divider borderColor="border" my={8} />

            <Box mb={8}>
              <Heading size="md" color="fg" mb={4}>
                Bagian 2: Data Engagement
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <Box colSpan={{ base: "1fr", md: "2fr" }}>
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
                />
                <RHFNumberInput
                  name="totalViews"
                  label="Total Views / Tayangan"
                  placeholder="0"
                  isRequired
                  helperText="Jumlah total views dalam periode tersebut"
                />
                <RHFNumberInput
                  name="totalLikes"
                  label="Total Likes"
                  placeholder="0"
                  isRequired
                />
                <RHFNumberInput
                  name="totalComments"
                  label="Total Comments"
                  placeholder="0"
                  isRequired
                />
                <RHFNumberInput
                  name="totalShares"
                  label="Total Shares"
                  placeholder="0"
                  isRequired
                />
              </Grid>
            </Box>

            <Divider borderColor="border" my={8} />

            <Box mb={8}>
              <Heading size="md" color="fg" mb={4}>
                Bagian 3: Parameter Kalkulasi
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <Select
                  name="niche"
                  label="Niche / Kategori Konten"
                  placeholder="Pilih niche"
                  isRequired
                  bg="white"
                  color="black"
                >
                  {nicheOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <RHFNumberInput
                  name="videoCount"
                  label="Jumlah Video / Konten dalam Periode"
                  placeholder="1"
                  isRequired
                  defaultValue={1}
                  min={1}
                  helperText="Estimasi jumlah konten yang di-post"
                />
              </Grid>
            </Box>

            <Divider borderColor="border" my={8} />

            <Box>
              <Heading size="md" color="fg" mb={4}>
                Bagian 4: Opsional (Tambahan)
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <RHFNumberInput
                  name="carouselImageCount"
                  label="Jumlah Gambar (Carousel/Photo Mode)"
                  placeholder="0"
                  helperText="Isi jika ingin menghitung harga untuk Carousel/Photo Mode"
                />
                <RHFNumberInput
                  name="packageQuantity"
                  label="Package Quantity"
                  placeholder="0"
                  helperText="Jumlah package yang diinginkan (opsional)"
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
                <FaTiktok mr={2} />
                Hitung Rate Card
              </Button>
            </Box>
          </Box>

          {results && (
            <Box
              bg="surface"
              borderWidth="1px"
              borderColor="border"
              borderRadius="card"
              p={8}
              mt={8}
            >
              <Heading size="lg" color="fg" mb={6} textAlign="center">
                Hasil Perhitungan Rate Card TikTok
              </Heading>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={8}>
                <Box>
                  <Text color="muted" fontSize="sm">Niche</Text>
                  <Text color="fg" fontWeight="bold" fontSize="lg">{results.niche}</Text>
                </Box>
                <Box>
                  <Text color="muted" fontSize="sm">Total Views</Text>
                  <Text color="fg" fontWeight="bold" fontSize="lg">{results.totalViews.toLocaleString()}</Text>
                </Box>
                <Box>
                  <Text color="muted" fontSize="sm">Engagement Rate</Text>
                  <Text color="fg" fontWeight="bold" fontSize="lg">{results.engagementRate.toFixed(2)}%</Text>
                </Box>
                <Box>
                  <Text color="muted" fontSize="sm">CPM (Cost Per Mille)</Text>
                  <Text color="fg" fontWeight="bold" fontSize="lg">Rp {results.cpm.toLocaleString()}</Text>
                </Box>
              </Grid>

              <Divider borderColor="border" my={6} />

              <Heading size="md" color="fg" mb={4}>
                Estimasi Harga per Content Type
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                {results.contentTypes.map((ct, idx) => (
                  <Box
                    key={idx}
                    bg="bg"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="card"
                    p={4}
                  >
                    <Text color="fg" fontWeight="bold" fontSize="md">{ct.label}</Text>
                    <Text color="muted" fontSize="sm" mt={1}>
                      {ct.description}
                    </Text>
                    <Box mt={3}>
                      <Text color="muted" fontSize="xs">Rate per video</Text>
                      <Text color="fg" fontWeight="bold" fontSize="lg">
                        Rp {(results.videoCount * ct.rate).toLocaleString()}
                      </Text>
                    </Box>
                    {ct.durationOptions && (
                      <Box mt={2}>
                        <Text color="muted" fontSize="xs" textTransform="uppercase">
                          Breakdown per durasi:
                        </Text>
                        {ct.durationOptions.map((dur, i) => (
                          <Flex key={i} justify="space-between" mt={1}>
                            <Text color="muted" fontSize="sm">{dur.label}</Text>
                            <Text color="fg" fontSize="sm">
                              Rp {((results.videoCount * ct.rate) * dur.multiplierExtra).toLocaleString()}
                            </Text>
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Grid>

              <Divider borderColor="border" my={6} />

              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                <Box bg="accent.purple" p={4} borderRadius="card" textAlign="center">
                  <Text color="white" fontSize="xs" textTransform="uppercase">Video Count</Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">{results.videoCount}</Text>
                </Box>
                <Box bg="accent.pink" p={4} borderRadius="card" textAlign="center">
                  <Text color="white" fontSize="xs" textTransform="uppercase">Rate / Video</Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    Rp {results.ratePerVideo.toLocaleString()}
                  </Text>
                </Box>
                <Box bg="accent.blue" p={4} borderRadius="card" textAlign="center">
                  <Text color="white" fontSize="xs" textTransform="uppercase">Total Rate</Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    Rp {results.totalRate.toLocaleString()}
                  </Text>
                </Box>
              </Grid>

              <Box mt={6} textAlign="center">
                <Button
                  as={NextLink}
                  href="/calculator/tiktok"
                  colorScheme="gray"
                  variant="outline"
                >
                  <FaTimes mr={2} />
                  Hitung Ulang
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </FormProvider>
  );
}
