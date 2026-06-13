import './App.css'

function App() {
  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Voice Canvas</p>
          <h1>AI 语音绘图工作台</h1>
        </div>
        <div className="statusPill">MVP Foundation</div>
      </header>

      <section className="workspace" aria-label="Voice Canvas workspace">
        <div className="emptyCanvas">
          <p className="emptyCanvasTitle">结构化画布</p>
          <p className="emptyCanvasText">
            后续 PR 会接入 ProjectState、命令系统、Fabric 渲染和语音 Agent。
          </p>
        </div>
      </section>

      <footer className="voiceBar">
        <div>
          <strong>语音状态</strong>
          <span>等待基础模块接入</span>
        </div>
        <button type="button" disabled>
          开始语音创作
        </button>
      </footer>
    </main>
  )
}

export default App
