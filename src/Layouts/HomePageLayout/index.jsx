import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function HomeLayout({ children }) {
  return (
    <React.Fragment>
      <Header />
      {children}
      <Footer />
    </React.Fragment>
  );
}
