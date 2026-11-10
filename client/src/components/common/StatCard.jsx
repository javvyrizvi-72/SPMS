const tints = {
  blue: 'bg-blue-500/15 text-blue-300',
  green: 'bg-green-500/15 text-green-300',
  purple: 'bg-purple-500/15 text-purple-300',
  orange: 'bg-gold-500/15 text-gold-300',
  red: 'bg-red-500/15 text-red-300',
}

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
  <div className="card relative overflow-hidden hover:border-gold-500/40 transition-colors">
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${tints[color] || tints.blue}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm font-medium text-navy-300 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>}
  </div>
)

export default StatCard
