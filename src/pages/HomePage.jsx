import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import images from '../assets/images';
import { useAuth } from '../context/AuthContext';
import useReveal from '../hooks/useReveal';
import '../components/Button.css'; // The links below reuse the .btn styles.
import './HomePage.css';

// Slides of the hero slider (Bridge uses a full-screen photo slider).
const SLIDES = [
  { image: images.heroJump, eyebrow: 'Equestrian centre', title: 'Saddle up', subtitle: 'Start riding' },
  { image: images.heroWhite, eyebrow: 'Tournaments', title: 'Take your seat', subtitle: 'Feel the jump' },
  { image: images.heroRider, eyebrow: 'Lessons for all levels', title: 'Ride with us', subtitle: 'Learn the art' },
];

const SLIDE_TIME = 6000; // Milliseconds each slide stays on screen.

const SERVICES = [
  {
    title: 'Riding lessons',
    text: 'Group and private sessions for every level, from first steps to advanced riders.',
    image: images.lessons,
    to: '/sessions',
  },
  {
    title: 'Tournaments',
    text: 'Show jumping, dressage and more. Choose your seat on the map, like at the cinema.',
    image: images.tournaments,
    to: '/tournaments',
  },
  {
    title: 'Our horses',
    text: 'Calm, well-trained horses matched to your skill level for every booking.',
    image: images.horses,
    to: '/sessions',
  },
];

const HORSE_NAMES = ['Amira', 'Thunder', 'Snow', 'Bella'];

const STATS = [
  { number: '12', label: 'Horses' },
  { number: '4', label: 'Instructors' },
  { number: '9', label: 'Disciplines' },
  { number: '300+', label: 'Seats per event' },
];

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const [current, setCurrent] = useState(0);
  useReveal();

  // Move to the next slide every SLIDE_TIME. Restarts when the user clicks a dot.
  useEffect(() => {
    const timer = setTimeout(() => setCurrent((current + 1) % SLIDES.length), SLIDE_TIME);
    return () => clearTimeout(timer);
  }, [current]);

  const slide = SLIDES[current];

  return (
    <>
      {/* ---------- Hero slider: photos crossfade with a slow zoom (Ken Burns) ---------- */}
      <section className="hero" aria-roledescription="carousel">
        {SLIDES.map((item, index) => (
          <div
            key={item.title}
            className={`hero-slide ${index === current ? 'active' : ''}`}
            style={{ backgroundImage: `url(${item.image})` }}
            aria-hidden={index !== current}
          />
        ))}
        <div className="hero-overlay" />

        {/* key={current} re-creates the text, so its fade-up animation plays on every slide. */}
        <div className="hero-content container" key={current}>
          <span className="eyebrow hero-eyebrow fade-up">{slide.eyebrow}</span>
          <h1 className="hero-title fade-up" style={{ animationDelay: '0.15s' }}>
            {slide.title}
            <em>{slide.subtitle}</em>
          </h1>
          <div className="hero-actions fade-up" style={{ animationDelay: '0.35s' }}>
            <Link to="/sessions" className="btn btn-light">
              Book a lesson
            </Link>
            <Link to="/tournaments" className="btn btn-light">
              Buy tickets
            </Link>
          </div>
        </div>

        <div className="hero-dots">
          {SLIDES.map((item, index) => (
            <button
              key={item.title}
              className={`hero-dot ${index === current ? 'active' : ''}`}
              onClick={() => setCurrent(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ---------- About us: three photos with painted edges ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-heading reveal">
            <h2>About us</h2>
            <p>
              A centre where you and your horse feel at home. Book riding lessons with our
              instructors and get your tickets for the next tournament, all in one place.
            </p>
          </div>

          <div className="service-grid">
            {SERVICES.map((service, index) => (
              <Link
                to={service.to}
                key={service.title}
                className="service-card reveal"
                style={{ transitionDelay: `${index * 0.15}s` }}
              >
                <div className="brush-frame">
                  <img src={service.image} alt={service.title} loading="lazy" />
                </div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Quote on a photo, fixed background (parallax) ---------- */}
      <section className="quote" style={{ backgroundImage: `url(${images.heroRider})` }}>
        <div className="hero-overlay" />
        <div className="container quote-content reveal">
          <blockquote>“No hour of life is wasted that is spent in the saddle.”</blockquote>
          <p className="quote-author">Winston Churchill</p>
        </div>
      </section>

      {/* ---------- Meet our horses: black and white photos that turn colour on hover ---------- */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-heading reveal">
            <h2>Meet our horses</h2>
            <p>Every lesson comes with a horse chosen for your level.</p>
          </div>

          <div className="horse-grid">
            {images.gallery.map((src, index) => (
              <figure
                key={src}
                className="horse-card reveal"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <img src={src} alt={`Our horse ${HORSE_NAMES[index]}`} loading="lazy" />
                <figcaption>{HORSE_NAMES[index]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Numbers ---------- */}
      <section className="stats">
        <div className="container stats-grid">
          {STATS.map((stat, index) => (
            <div key={stat.label} className="stat reveal" style={{ transitionDelay: `${index * 0.1}s` }}>
              <p className="stat-number">{stat.number}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Closing call to action on a photo ---------- */}
      <section className="cta" style={{ backgroundImage: `url(${images.sunset})` }}>
        <div className="hero-overlay" />
        <div className="cta-content container reveal">
          <h2>Ride in style</h2>
          <p className="cta-text">Giving you the wings you need.</p>
          <Link to={isLoggedIn ? '/sessions' : '/register'} className="btn btn-light">
            Start today
          </Link>
        </div>
      </section>
    </>
  );
}
