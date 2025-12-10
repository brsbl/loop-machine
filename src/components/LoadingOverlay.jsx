function LoadingOverlay({ isLoading }) {
  if (!isLoading) return null

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading sounds...</div>
    </div>
  )
}

export default LoadingOverlay
