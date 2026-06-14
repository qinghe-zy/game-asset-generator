import './CommandLog.css'

export interface CommandLogEntry {
  id: string
  label: string
  detail: string
  tone?: 'neutral' | 'success' | 'warning'
}

export interface CommandLogProps {
  entries: CommandLogEntry[]
}

export function CommandLog({ entries }: CommandLogProps) {
  return (
    <aside className="commandLog" aria-label="命令日志">
      <div className="commandLogHeader">
        <span>Command log</span>
        <strong>{entries.length}</strong>
      </div>
      <ol className="commandLogList">
        {entries.map((entry) => (
          <li
            className={`commandLogEntry commandLogEntry-${entry.tone ?? 'neutral'}`}
            key={entry.id}
          >
            <span>{entry.label}：</span>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </aside>
  )
}
