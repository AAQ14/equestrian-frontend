import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-logo">Equestria</p>
          <p className="footer-tagline">A club where you and your horse feel at home.</p>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Equestria · Final degree project</p>
      </div>
    </footer>
  );
}
