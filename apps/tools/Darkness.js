view Darkness {
  <div />

  $div = {
    opacity: ^shown ? 1 : 0,
    transition: "all 50ms ease-in",
    position: "fixed",
    top: ^top,
    left: ^left,
    border: "1px solid yellow",
    zIndex: 1000000,
    boxShadow: "0 0 0 2000px rgba(0,0,0,0.2)",
    borderRadius: ^borderRadius,
    width: ^width,
    height: ^height,
  }
}