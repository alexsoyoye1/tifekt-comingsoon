import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./App.css";
import dancer from "./Dancer.gif";
import balletdancer from "./balletdancer.gif";

function App() {
  const spotlightRef = useRef(null);
  const dancerARef = useRef(null);
  const dancerBRef = useRef(null);
  const titleRef = useRef(null); // New ref for the title
  const backend = import.meta.env.VITE_API || "http://localhost:4000";

  const [activeDancer, setActiveDancer] = useState(0);
  const DURATION_SHOW = 4000;

  // Animate spotlight background with GSAP
  useEffect(() => {
    if (!spotlightRef.current || typeof gsap === "undefined") return;

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "sine.inOut" },
    });

    tl.to(spotlightRef.current, {
      backgroundPosition: "120% 50%",
      duration: 6,
    }).to(spotlightRef.current, {
      backgroundPosition: "-20% 50%",
      duration: 6,
    });

    return () => tl.kill();
  }, []);

  // Animate "Tifekt Coming Soon" title
  useEffect(() => {
    if (!titleRef.current || typeof gsap === "undefined") return;

    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: -50,
        scale: 0.8,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: "back.out(1.7)", // A nice bouncy ease
        delay: 0.5, // Delay the animation slightly after component mounts
      }
    );
  }, []); // Run once on component mount

  // Alternate dancers by toggling a CSS class
  useEffect(() => {
    const dancerA = dancerARef.current;
    const dancerB = dancerBRef.current;
    if (!dancerA || !dancerB) return;

    if (activeDancer === 0) {
      dancerA.classList.add("active");
      dancerB.classList.remove("active");
    } else {
      dancerA.classList.remove("active");
      dancerB.classList.add("active");
    }

    const timerId = setTimeout(() => {
      setActiveDancer((prev) => (prev === 0 ? 1 : 0));
    }, DURATION_SHOW);

    return () => clearTimeout(timerId);
  }, [activeDancer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
    };

    try {
      const res = await fetch(`${backend}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      alert("💃 You’re on the list!");
      console.log("✅ Backend response:", data);
      form.reset();
    } catch (err) {
      console.error("❌ Submission failed:", err);
      alert("⚠️ Something went wrong. Please try again later.");
    }
  };

  return (
    <>
      <div className="page">
        <div className="stage">
          <div ref={spotlightRef} className="spotlight"></div>
          <h1 ref={titleRef}>Tifekt Coming Soon</h1>{" "}
          {/* Apply the ref and update the text */}
          <div className="stage-floor" />
          <div ref={dancerARef} className="dancer-container">
            <img src={balletdancer} alt="Ballet Dancer" />
          </div>
          <div ref={dancerBRef} className="dancer-container">
            <img src={dancer} alt="Dancer" />
          </div>
        </div>
        <div className="formPanel">
          <h2>Join the Guest List</h2>
          <form onSubmit={handleSubmit}>
            <input name="name" placeholder="Name" required />
            <input name="phone" placeholder="Phone" required />
            <input type="email" name="email" placeholder="Email" required />
            <button type="submit">Sign Up</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default App;
