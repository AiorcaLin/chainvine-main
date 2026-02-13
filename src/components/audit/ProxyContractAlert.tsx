interface ProxyContractAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onViewImplementation: () => void;
}

export default function ProxyContractAlert({
  isOpen,
  onClose,
  onViewImplementation,
}: ProxyContractAlertProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary 
        rounded-lg border border-border p-6 w-[480px] z-50 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <svg
              className="w-6 h-6 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Proxy Contract Detected
            </h3>
            <p className="text-muted mb-4">
              This is a proxy contract. The actual implementation of the
              contract logic is stored at a different address.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-card-hover hover:bg-secondary-hover text-muted 
                  rounded-lg text-sm border border-border transition-colors"
              >
                Stay on Proxy
              </button>
              <button
                onClick={() => {
                  onViewImplementation();
                  onClose();
                }}
                className="px-4 py-2 bg-card-hover hover:bg-accent/10 text-accent
                  rounded-lg text-sm border border-accent/20 transition-colors
                  hover:border-accent/40"
              >
                View Implementation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
