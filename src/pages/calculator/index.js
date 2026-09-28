import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";
import { useEffect } from "react";
import { useRouter } from "next/router";

Calculator.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Calculator() {
  const router = useRouter();
  useEffect(() => {
    router.push("/calculator/tiktok");
  }, []);
}
