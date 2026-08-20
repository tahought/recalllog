import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="eyebrow">Spaced Repetition Study Log</div>
        <h1>学んだことを、忘れる前に。</h1>
        <p>
          RecallLog は「その日に学んだこと」を書き留めるだけで、忘却曲線
          （1日後・3日後・1週間後・2週間後・1か月後）に沿って
          <strong> 次に復習すべき日を自動で提案</strong>する学習ログです。
          今日やるべき復習がひと目でわかり、カレンダーで先の予定も見渡せます。
        </p>
        <div className="cta-row">
          <Link href="/signup" className="btn">
            無料で始める
          </Link>
          <Link href="/login" className="btn btn-ghost">
            ログイン
          </Link>
        </div>

        <div className="feature-grid">
          <div className="feature">
            <div className="num">01</div>
            <h3>書くだけでスケジューリング</h3>
            <p>
              学んだ内容を記録すると、初回の復習日（翌日）が自動でセットされます。
            </p>
          </div>
          <div className="feature">
            <div className="num">02</div>
            <h3>忘却曲線に沿った間隔反復</h3>
            <p>
              「覚えていた」を押すたびに復習間隔が伸び、効率よく記憶を定着させます。
            </p>
          </div>
          <div className="feature">
            <div className="num">03</div>
            <h3>今日の復習ダッシュボード</h3>
            <p>
              今日やるべき件数・正答率・連続日数を集計。迷わず復習を始められます。
            </p>
          </div>
          <div className="feature">
            <div className="num">04</div>
            <h3>復習カレンダー</h3>
            <p>
              いつ・何を復習するのかを月表示で俯瞰。予定の偏りも把握できます。
            </p>
          </div>
          <div className="feature">
            <div className="num">05</div>
            <h3>検索・タグ整理</h3>
            <p>
              科目やキーワードで学習ログを横断検索。増えても迷子になりません。
            </p>
          </div>
          <div className="feature">
            <div className="num">06</div>
            <h3>あなたのデータはあなただけに</h3>
            <p>
              JWT 認証と本人限定の認可で、学習記録を安全に保護します。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
