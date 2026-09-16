import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ReconciliationChat } from "@/components/ReconciliationChat";


export default function Home() {
  return (
    <div className="page">
      <Header initials="SE" />
      <main id="main-content">
        <Hero />
        <ReconciliationChat />
      </main>

      <footer className="site-footer">
        <div className="site-footer__org">
          AcmeCommerce · Financial Operations
        </div>
        <div className="site-footer__quip">
          Every satoshi accounted for.
        </div>
      </footer>
    </div>
  );
}
