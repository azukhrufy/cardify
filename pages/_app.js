import { ChakraProvider, Box } from "@chakra-ui/react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";

import theme from "@/theme";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Box
        className={`${jakarta.variable} ${inter.variable}`}
        fontFamily="body"
        minH="100vh"
        bg="bg"
        color="fg"
      >
        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
}
