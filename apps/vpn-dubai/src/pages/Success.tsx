import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Download, 
  QrCode, 
  Smartphone, 
  Building2,
  Loader2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

interface SubscriptionStatus {
  status: string;
  email: string;
  wgClientId: string | null;
  expiresAt: string;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [config, setConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Poll for subscription status (VPN client creation might take a moment)
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const statusRes = await fetch(`/api/subscriptions/status/${sessionId}`);
          const statusData = await statusRes.json();
          
          if (statusData.wgClientId) {
            setStatus(statusData);
            
            // Fetch QR code
            const qrRes = await fetch(`/api/subscriptions/qrcode/${sessionId}`);
            if (qrRes.ok) {
              const qrSvg = await qrRes.text();
              setQrCode(qrSvg);
            }
            
            // Fetch config
            const configRes = await fetch(`/api/subscriptions/config/${sessionId}`);
            if (configRes.ok) {
              const configData = await configRes.json();
              setConfig(configData.config);
            }
            
            setLoading(false);
            return;
          }
          
          attempts++;
          await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
        }
        
        setError('VPN configuration is being prepared. Please refresh in a moment.');
        setLoading(false);
      } catch (err) {
        setError('Failed to load subscription details');
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const copyConfig = async () => {
    if (config) {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadConfig = () => {
    if (config) {
      const blob = new Blob([config], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dubai-vpn.conf';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dubai text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-dubai-gold animate-spin mx-auto mb-4" />
          <p className="text-xl">Setting up your VPN...</p>
          <p className="text-gray-400 mt-2">This usually takes just a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-dubai text-white flex items-center justify-center p-6">
        <div className="card-glass p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Almost There!</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-dubai-gold text-dubai-night font-semibold rounded-full hover:bg-dubai-gold/90 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dubai text-white">
      {/* Header */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-dubai-gold" />
          <span className="text-xl font-bold">Dubai<span className="text-dubai-gold">VPN</span></span>
        </Link>
      </nav>

      {/* Success Content */}
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to Dubai<span className="text-dubai-gold">VPN</span>!
          </h1>
          <p className="text-gray-400">
            Your subscription is active. Scan the QR code below to connect.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="card-glass p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-dubai-gold" />
            Your VPN Configuration
          </h2>

          {qrCode && (
            <div className="bg-white p-6 rounded-xl mb-6 max-w-xs mx-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: qrCode }} 
                className="w-full aspect-square"
              />
            </div>
          )}

          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-dubai-gold" />
              How to Connect
            </h3>
            <ol className="text-gray-300 space-y-2 text-sm">
              <li>1. Download the <strong>WireGuard</strong> app on your device</li>
              <li>2. Open the app and tap <strong>"+"</strong> or <strong>"Add Tunnel"</strong></li>
              <li>3. Select <strong>"Scan QR Code"</strong></li>
              <li>4. Point your camera at the QR code above</li>
              <li>5. Toggle the connection <strong>ON</strong> — you're protected!</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadConfig}
              className="flex-1 py-3 bg-dubai-gold text-dubai-night font-semibold rounded-xl hover:bg-dubai-gold/90 transition flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Config
            </button>
            <button
              onClick={copyConfig}
              className="flex-1 py-3 bg-white/10 border border-white/20 font-semibold rounded-xl hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Config
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Info */}
        {status && (
          <div className="card-glass p-6">
            <h3 className="font-semibold mb-4">Subscription Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Email</span>
                <p className="font-medium">{status.email}</p>
              </div>
              <div>
                <span className="text-gray-400">Status</span>
                <p className="font-medium capitalize text-green-500">{status.status}</p>
              </div>
              <div>
                <span className="text-gray-400">Next Billing</span>
                <p className="font-medium">
                  {new Date(status.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Price</span>
                <p className="font-medium">€6/month</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Apps */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Download WireGuard for your device:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'iOS', url: 'https://apps.apple.com/app/wireguard/id1441195209' },
              { name: 'Android', url: 'https://play.google.com/store/apps/details?id=com.wireguard.android' },
              { name: 'macOS', url: 'https://apps.apple.com/app/wireguard/id1451685025' },
              { name: 'Windows', url: 'https://download.wireguard.com/windows-client/wireguard-installer.exe' },
            ].map((app) => (
              <a
                key={app.name}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-sm"
              >
                {app.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            Questions? Contact us at support@example.com
          </p>
        </div>
      </footer>
    </div>
  );
}
