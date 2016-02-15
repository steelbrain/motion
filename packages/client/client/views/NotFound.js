const NotFound = (name) => (
  () => (
    <div style={{ display: 'block' }}>
      {process.env.production ? '' : `Motion: View "${name}" not found`}
    </div>
  )
)

export default NotFound
