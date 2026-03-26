import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import GlobalScale from './components/GlobalScale'
import Developers from './components/Developers'
import Pricing from './components/Pricing'
import CTA from './components/CTA'
import Footer from './components/Footer'

function App() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <Features />
      <GlobalScale />
      <Developers />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
