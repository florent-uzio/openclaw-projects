import { useState } from 'react';
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Smartphone, 
  QrCode,
  Check,
  ArrowRight,
  Building2
} from 'lucide-react';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Military-Grade Encryption',
      description: 'WireGuard protocol with state-of-the-art cryptography',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized servers in Dubai for minimal latency',
    },
    {
      icon: Globe,
      title: 'Access Everything',
      description: 'Unblock content and browse without restrictions',
    },
    {
      icon: Lock,
      title: 'No Logs Policy',
      description: 'Your privacy is our priority. Zero activity logs.',
    },
    {
      icon: Smartphone,
      title: 'All Devices',
      description: 'Works on iOS, Android, Mac, Windows & Linux',
    },
    {
      icon: QrCode,
      title: 'Easy Setup',
      description: 'Scan QR code and connect in seconds',
    },
  ];

  const steps = [
    { step: 1, title: 'Subscribe', description: 'Enter your email and pay €6/month' },
    { step: 2, title: 'Get QR Code', description: 'Receive your unique configuration instantly' },
    { step: 3, title: 'Connect', description: 'Scan with WireGuard app and enjoy!' },
  ];

  return (
    <div className="min-h-screen bg-gradient-dubai text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-dubai-gold/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-20 w-60 h-60 bg-dubai-gold/10 rounded-full blur-3xl" />
        </div>

        <nav className="relative container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-dubai-gold" />
            <span className="text-xl font-bold">Dubai<span className="text-dubai-gold">VPN</span></span>
          </div>
          <a 
            href="#pricing" 
            className="px-6 py-2 bg-dubai-gold text-dubai-night font-semibold rounded-full hover:bg-dubai-gold/90 transition"
          >
            Get Started
          </a>
        </nav>

        <div className="relative container mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium VPN from{' '}
            <span className="text-gradient">Dubai</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Fast, secure, and reliable. Access the internet freely with our UAE-based VPN service. 
            Simple setup, powerful protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="#pricing"
              className="px-8 py-4 bg-dubai-gold text-dubai-night font-bold rounded-full hover:bg-dubai-gold/90 transition flex items-center gap-2 text-lg"
            >
              Start for €6/month <ArrowRight className="w-5 h-5" />
            </a>
            <span className="text-gray-400">No contracts. Cancel anytime.</span>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why Choose Dubai<span className="text-dubai-gold">VPN</span>?
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Enterprise-grade security meets simplicity. Everything you need, nothing you don't.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-glass p-8 hover:bg-white/15 transition group"
            >
              <feature.icon className="w-12 h-12 text-dubai-gold mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-black/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Get Connected in <span className="text-dubai-gold">3 Steps</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            From signup to secure browsing in under 2 minutes.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-dubai-gold/20 text-dubai-gold text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Simple, <span className="text-dubai-gold">Transparent</span> Pricing
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          One plan. All features. No hidden fees.
        </p>

        <div className="max-w-md mx-auto">
          <div className="card-glass p-8 border-dubai-gold/50">
            <div className="text-center mb-8">
              <span className="text-5xl font-bold">€6</span>
              <span className="text-gray-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Unlimited bandwidth',
                'WireGuard protocol',
                'Dubai server location',
                'All devices supported',
                'Instant QR code setup',
                'Cancel anytime',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-dubai-gold flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-dubai-gold transition text-white placeholder-gray-400"
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-dubai-gold text-dubai-night font-bold rounded-xl hover:bg-dubai-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    Get Started <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-4">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-black/30">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Frequently Asked <span className="text-dubai-gold">Questions</span>
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'What is WireGuard?',
                a: 'WireGuard is a modern, fast, and secure VPN protocol. It\'s simpler and more efficient than older protocols like OpenVPN.',
              },
              {
                q: 'How do I connect?',
                a: 'Download the free WireGuard app on your device, then scan the QR code we provide. That\'s it — you\'re connected!',
              },
              {
                q: 'Can I use it on multiple devices?',
                a: 'Each subscription includes one device configuration. Need more devices? Contact us for a custom plan.',
              },
              {
                q: 'What if I have issues?',
                a: 'Reach out via email and we\'ll help you get connected within 24 hours.',
              },
            ].map((faq, i) => (
              <div key={i} className="card-glass p-6">
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6 text-dubai-gold" />
            <span className="font-bold">Dubai<span className="text-dubai-gold">VPN</span></span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} DubaiVPN. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
