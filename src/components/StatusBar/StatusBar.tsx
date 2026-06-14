import './StatusBar.css'

export interface StatusSegment {
  label: string
  value: string
  tone?: 'neutral' | 'ready' | 'warning'
}

export interface StatusBarProps {
  title: string
  subtitle: string
  statusMessage: string
  segments: StatusSegment[]
}

export function StatusBar({
  title,
  subtitle,
  statusMessage,
  segments,
}: StatusBarProps) {
  return (
    <header className="statusBar" aria-label="运行状态">
      <div className="statusBarIdentity">
        <p className="statusBarEyebrow">Voice Canvas</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="statusBarRuntime" aria-label="运行模式">
        {segments.map((segment) => (
          <div
            className={`statusBarSegment statusBarSegment-${segment.tone ?? 'neutral'}`}
            key={segment.label}
          >
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </div>
        ))}
        <div className="statusBarMessage">{statusMessage}</div>
      </div>
    </header>
  )
}
