export default function StatsTable({ stats }) {
  return (
    <div className="card">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {stats.map((stat, idx) => (
            <tr key={idx} style={{ borderBottom: idx < stats.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
              <td style={{ padding: '8px', textAlign: 'left' }}>{stat.label}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{stat.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
