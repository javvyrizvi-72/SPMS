const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent mb-4"></div>
    <p className="text-navy-300 font-medium">{text}</p>
  </div>
)

export default Loader
