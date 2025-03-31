import net from 'net';

function sendNewNym() {
  const socket = net.connect(9051, '127.0.0.1', () => {
    socket.write('AUTHENTICATE "yourpassword"\r\n');
    socket.write('SIGNAL NEWNYM\r\n');
    socket.write('QUIT\r\n');
  });

  socket.on('data', (data) => {
    console.log('Tor Control Response:', data.toString());
  });

  socket.on('end', () => {
    console.log('New Tor Circuit (New IP requested)');
  });
}

sendNewNym();
