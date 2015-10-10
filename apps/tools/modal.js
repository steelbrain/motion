view Modal {
  <modal>
    <close onClick={^onClose}>X</close>
    <title if={^title}>{^title}</title>
    <message>{^children}</message>
  </modal>

  $ = {
    position: 'absolute',
    top: ^open ? 20 : -100,
    left: 20,
    padding: [10, 10],
    background: '#f9f9f9',
    border: '1px solid #ddd',
    boxShadow: '0 0 8px rgba(0,0,0,0.05)',
    borderRadius: 4,
    fontSize: 15,
    transition: 'all ease-in 200ms',
    textAlign: 'center',
    pointerEvents: 'auto'
  }

  $title = {
    color: '#C43D2D',
    fontWeight: 'bold',
    margin: [-4, 20, 0]
  }

  $message = {
    fontFamily: "Helvetica Nueue, Helvetica, Arial, sans-serif",
  }

  $close = {
    position: 'absolute',
    top: 3,
    right: 3,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
    fontSize: 10,
    background: '#fff',
    color: '#333',
    borderRadius: 20,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }
}