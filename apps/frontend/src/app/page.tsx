import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-body">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-surface/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">G</span>
            </div>
            <span className="font-heading font-bold text-xl text-text">GTT</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            AI-Powered Market Intelligence
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-text leading-tight mb-6">
            Global Theme Tracer
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
            방대한 글로벌 뉴스에서 시장의 흐름과 미래 유망 테마를 선제적으로 포착합니다.
          </p>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
            Discover emerging investment themes before the market does.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-primary text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-primary-dark transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/signup"
              className="border border-border text-text px-8 py-3 rounded-xl font-medium text-lg hover:bg-background transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center text-text mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary text-center mb-16 max-w-2xl mx-auto">
            매일 글로벌 뉴스를 수집하고, AI가 심층 분석하여 유망 테마를 도출합니다.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'News Collection',
                titleKo: '뉴스 수집',
                desc: 'Reuters, Bloomberg, AP 등 글로벌 외신에서 주요 기사를 실시간으로 수집하고 카테고리별로 자동 분류합니다.',
                color: 'bg-secondary/10 text-secondary',
              },
              {
                step: '02',
                title: 'AI Deep Analysis',
                titleKo: 'AI 심층 분석',
                desc: 'OpenAI가 뉴스 간 상관관계를 분석하고, 빈도와 영향력을 결합하여 거시적 변화 흐름을 파악합니다.',
                color: 'bg-emerging/10 text-emerging',
              },
              {
                step: '03',
                title: 'Theme & Report',
                titleKo: '테마 도출 & 리포트',
                desc: '유망 산업군과 키워드를 근거와 함께 제시하고, 리스크 분석과 과거 추이를 포함한 리포트를 발행합니다.',
                color: 'bg-accent/10 text-accent',
              },
            ].map((feature) => (
              <div
                key={feature.step}
                className="p-8 rounded-2xl border border-border hover:border-secondary/30 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} font-heading font-bold text-lg mb-5`}>
                  {feature.step}
                </div>
                <h3 className="font-heading font-semibold text-lg text-text mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm font-medium text-secondary mb-3">{feature.titleKo}</p>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-text mb-4">
            Start Tracking Global Themes
          </h2>
          <p className="text-text-secondary mb-8">
            전략적 의사결정에 필요한 인사이트를 매일 받아보세요.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-primary-dark transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xs">G</span>
            </div>
            <span className="font-heading font-semibold text-text">Global Theme Tracer</span>
          </div>
          <p>Powered by AI</p>
        </div>
      </footer>
    </main>
  );
}
