import MarketingNav from '@/components/marketing/MarketingNav'
import Hero from '@/components/marketing/Hero'
import LogoMarquee from '@/components/marketing/LogoMarquee'
import Features from '@/components/marketing/Features'
import HowItWorks from '@/components/marketing/HowItWorks'
import AskOrlaSpotlight from '@/components/marketing/AskOrlaSpotlight'
import MarketingCTA from '@/components/marketing/MarketingCTA'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <Features />
        <HowItWorks />
        <AskOrlaSpotlight />
        <MarketingCTA />
      </main>
      <MarketingFooter />
    </>
  )
}
