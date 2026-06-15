import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function PieChartWidget({ data, title }) {
  const COLORS = ['#F5C800', '#FFE066', '#E6B300', '#D4A500']

  return (
    <div className="card">
      <h4>{title}</h4>
      <div style={{ width: '100%', height: '200px', marginTop: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
