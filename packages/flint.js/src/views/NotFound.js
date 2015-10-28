const NotFound = (name) => (
  () => (
    <div style={{ display: 'block' }}>
      {process.env.production ? '' : `Flint: View "${name}" not found`}
    </div>
  )
)

export default NotFound
