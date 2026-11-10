import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-navy-800 border border-navy-600 rounded-xl shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600" />
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors">
            <X size={18} className="text-navy-300" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
