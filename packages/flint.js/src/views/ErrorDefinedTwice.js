const ErrorDefinedTwice = (name) => (
  () => (
    <p style={{ color: 'red', fontWeight: 'bold' }}>
      Error! You've defined the view {name} twice in your codebase.
    </p>
  )
)

export default ErrorDefinedTwice