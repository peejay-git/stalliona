import Link from 'next/link';
import Layout from '@/components/Layout';
import StellarSdk from 'stellar-sdk';
import ParticleBackground from '@/components/ParticlesBackground';
export default function Home() {
  return (
    <Layout>
      <div className="relative bg-gradient-to-r from-stellar-blue to-stellar-navy">
        <ParticleBackground />
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
          <div className="backdrop-blur-xl bg-white/60 border border-white/20 shadow-xl rounded-3xl p-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Stallion</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
              Connect, contribute, and earn rewards on the Stellar blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/bounties" className="btn-primary">
                Browse Bounties
              </Link>
              <Link href="/create" className="btn-secondary">
                Create Bounty
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[{ label: 'Active Bounties', value: '200+' }, { label: 'Contributors', value: '5,000+' }, { label: 'Rewards Paid', value: '$1.2M+' }].map((stat, index) => (
              <div key={index} className="backdrop-blur-xl bg-white/60 border border-white/20 shadow-xl rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-blue-700 mb-2">{stat.value}</p>
                <p className="text-gray-700">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Browse Bounties',
                  description: 'Explore open opportunities across various projects and skill sets.',
                },
                {
                  title: 'Submit Work',
                  description: 'Complete tasks and submit your work for review.',
                },
                {
                  title: 'Get Rewarded',
                  description: 'Receive payment directly to your Stellar wallet upon approval.',
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:bg-white/20"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-stellar-blue to-stellar-purple text-white flex items-center justify-center text-xl font-bold mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/80">{step.description}</p>
                </div>


              ))}
            </div>
          </div>
        </section>

        {/* Featured Bounties Preview */}
        <section className="py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Featured Bounties</h2>
              <Link href="/bounties" className="text-white hover:underline font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-white transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
                >
                  <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300 rounded-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-300/20 text-blue-100 border border-blue-200/30 rounded-full text-sm font-medium">
                        Development
                      </span>
                      <span className="font-semibold text-green-300">$250–500</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      Build a Stellar Wallet Integration
                    </h3>
                    <p className="text-white/80 mb-6 line-clamp-3">
                      Create a seamless wallet integration for our platform using Soroban smart contracts...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Posted 2 days ago</span>
                      <Link
                        href={`/bounties/${i}`}
                        className="text-blue-200 hover:underline font-medium transition-colors duration-200"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>


          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-stellar-blue to-stellar-purple text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start earning with your skills?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join our growing community of developers, designers, and creators working on
              cutting-edge Web3 projects on the Stellar blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-stellar-blue font-medium py-2 px-6 rounded-lg hover:bg-opacity-90 transition-opacity">
                Create Account
              </Link>
              <Link href="/bounties" className="bg-transparent border border-white text-white font-medium py-2 px-6 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors">
                Browse Bounties
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="backdrop-blur-xl bg-white/5 border-t border-white/10 text-white py-12 px-4 md:px-6 shadow-inner">

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-8 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Stallion</h2>
                <p className="text-gray-200">Built on the Stellar blockchain</p>
              </div>
              <div className="flex gap-8">
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy
                </Link>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-8 flex justify-center md:justify-start space-x-6">
              <a href="https://x.com/Stallionsassmbl" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              <a href="https://discord.gg/8rKFQHNtb3" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-colors">
                <span className="sr-only">Discord</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>

              <a href="https://stallionss.gitbook.io/stallions" target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-white transition-colors">
                <span className="sr-only">Gitbook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10.802 17.77a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406m11.024-4.347a.703.703 0 11.001-1.406.703.703 0 01-.001 1.406m0-2.876a2.176 2.176 0 00-2.174 2.174c0 .233.039.465.115.691l-7.181 3.823a2.165 2.165 0 00-1.784-.937c-.829 0-1.584.475-1.95 1.216l-6.451-3.402c-.682-.358-1.192-1.48-1.138-2.502.028-.533.212-.947.493-1.107.178-.1.392-.092.62.027l.042.023c1.71.9 7.304 3.847 7.54 3.956.363.169.565.237 1.185-.057l11.564-6.014c.17-.064.368-.227.368-.474 0-.342-.354-.477-.355-.477-.658-.315-1.669-.788-2.655-1.25-2.108-.987-4.497-2.105-5.546-2.655-.906-.474-1.635-.074-1.765.006l-.252.125C7.78 6.048 1.46 9.178 1.1 9.397.457 9.789.058 10.57.006 11.539c-.08 1.537.703 3.14 1.824 3.727l6.822 3.518a2.175 2.175 0 002.15 1.862 2.177 2.177 0 002.173-2.14l7.514-4.073c.38.298.853.461 1.337.461A2.176 2.176 0 0024 12.72a2.176 2.176 0 00-2.174-2.174" />
                </svg>
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-white text-center md:text-left text-gray-200">
              <p>© {new Date().getFullYear()} Stallion. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
} 