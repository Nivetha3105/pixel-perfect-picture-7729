import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowRight, Heart, Music2, Pause, RotateCcw, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appreciationNotes, birthdayLetter, friendName, memories, secretNote, surpriseNames } from "@/lib/birthday-content";
import stilllife from "@/assets/birthday-stilllife.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Little World Made for You | A Birthday Surprise" },
      { name: "description", content: "A little birthday surprise made with extra care, just for you." },
      { property: "og:title", content: "A Little World Made for You | A Birthday Surprise" },
      { property: "og:description", content: "A little birthday surprise made with extra care, just for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BirthdayExperience,
});

type Scene = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function BirthdayExperience() {
  const [scene, setScene] = useState<Scene>(0);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [openedNotes, setOpenedNotes] = useState<number[]>([]);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [noteOrder, setNoteOrder] = useState<number[]>(() => appreciationNotes.map((_, index) => index));
  const [secretFound, setSecretFound] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [candles, setCandles] = useState([true, true, true]);
  const [celebrated, setCelebrated] = useState(false);
  const [letter, setLetter] = useState(birthdayLetter);
  const [letterChars, setLetterChars] = useState(0);
  const [letterStarted, setLetterStarted] = useState(false);
  const [letterComplete, setLetterComplete] = useState(false);
  const [secretEnding, setSecretEnding] = useState(false);
  const [muteEffects, setMuteEffects] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number }[]>([]);
  const letterStartedRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const sparkleIdRef = useRef(0);

  useEffect(() => {
    const audio = new Audio("/audio/background-music.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    bgMusicRef.current = audio;
    return () => {
      audio.pause();
      bgMusicRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!bgMusicRef.current) return;
    if (musicOn) {
      bgMusicRef.current.play().catch(() => {});
    } else {
      bgMusicRef.current.pause();
    }
  }, [musicOn]);

  const audioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  };

  const playTone = useCallback((frequency: number) => {
    if (muteEffects) return;
    const context = audioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.0001, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.33);
  }, [muteEffects]);

  const burstConfetti = useCallback((amount = 48) => {
    setConfetti(Array.from({ length: amount }, (_, id) => ({ id, x: Math.round(Math.random() * 96 + 2), delay: Math.random() * 350 })));
    window.setTimeout(() => setConfetti([]), 1700);
  }, []);

  useEffect(() => () => { if (audioRef.current) void audioRef.current.close(); }, []);

  useEffect(() => {
    if (scene === 5 && !letterStartedRef.current) {
      letterStartedRef.current = true;
      setLetterStarted(true);
    }
  }, [scene]);

  useEffect(() => {
    if (!letterStarted || letterComplete) return;
    let step = letterChars;
    const timer = window.setInterval(() => {
      step = Math.min(letter.length, step + 3);
      setLetterChars(step);
      if (step >= letter.length) {
        setLetterComplete(true);
        window.clearInterval(timer);
      }
    }, 15);
    return () => window.clearInterval(timer);
  }, [letter.length, letterChars, letterStarted, letterComplete]);

  useEffect(() => {
    if (candles.every((lit) => !lit) && !celebrated) {
      setCelebrated(true);
      burstConfetti(90);
    }
  }, [candles, celebrated, burstConfetti]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sprinkle = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = sparkleIdRef.current++;
    setSparkles((items) => [...items.slice(-16), { id, x: event.clientX - rect.left, y: event.clientY - rect.top }]);
    window.setTimeout(() => setSparkles((items) => items.filter((item) => item.id !== id)), 800);
  };

  const enterBirthday = () => {
    setEnvelopeOpen(true);
    playTone(523.25);
    setMusicOn(true);
    window.setTimeout(() => setScene(1), 1050);
  };

  const next = () => setScene((current) => Math.min(6, current + 1) as Scene);

  const pickRandomNote = () => {
    const unread = noteOrder.filter((index) => !openedNotes.includes(index));
    const pickFrom = unread.length ? unread : noteOrder;
    const selected = pickFrom[Math.floor(Math.random() * pickFrom.length)] ?? 0;
    setActiveNote(selected);
    setOpenedNotes((items) => items.includes(selected) ? items : [...items, selected]);
    playTone(392);
  };

  const replay = () => {
    setScene(0);
    setEnvelopeOpen(false);
    setGiftOpen(false);
    setOpenedNotes([]);
    setActiveNote(null);
    setNoteOrder(appreciationNotes.map((_, index) => index));
    setSecretFound(false);
    setFlippedCards([]);
    setSelectedPhoto(null);
    setCandles([true, true, true]);
    setCelebrated(false);
    setLetter(birthdayLetter);
    setLetterChars(0);
    setLetterStarted(false);
    setLetterComplete(false);
    letterStartedRef.current = false;
    setSecretEnding(false);
    setConfetti([]);
    setMusicOn(false);
  };

  const completedSurprises = [envelopeOpen, giftOpen, flippedCards.length > 0, openedNotes.length > 0, celebrated, letterComplete, secretEnding].filter(Boolean).length;
  const isFinalNight = scene === 6 && secretEnding;

  return (
    <main className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${isFinalNight ? "stars-field text-background" : "bg-background text-foreground"}`} onMouseMove={scene === 0 ? undefined : sprinkle}>
      {scene !== 0 && <UtilityBar musicOn={musicOn} muteEffects={muteEffects} onMusic={() => setMusicOn((value) => !value)} onMute={() => setMuteEffects((value) => !value)} onReplay={replay} />}
      {musicOn && <MusicPlayer onClose={() => setMusicOn(false)} />}
      {scene > 0 && <ProgressRail scene={scene} completed={completedSurprises} onJump={(target) => setScene(target)} />}
      <SparkleTrail sparkles={sparkles} />
      {confetti.length > 0 && <Confetti confetti={confetti} />}
      <div key={`${scene}-${secretEnding}`} className="scene-content">
        {scene === 0 && <EnvelopeScene open={envelopeOpen} onOpen={enterBirthday} name={friendName} />}
        {scene === 1 && <WelcomeScene open={giftOpen} name={friendName} onOpen={() => { setGiftOpen(true); playTone(659.25); burstConfetti(58); }} onContinue={next} />}
        {scene === 2 && <MemoriesScene flipped={flippedCards} onFlip={(index) => setFlippedCards((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index])} onPhoto={setSelectedPhoto} onContinue={next} />}
        {scene === 3 && <NotesScene activeNote={activeNote} opened={openedNotes} order={noteOrder} secretFound={secretFound} onPick={(index) => { setActiveNote(index); setOpenedNotes((items) => items.includes(index) ? items : [...items, index]); playTone(392); }} onRandom={pickRandomNote} onSecret={() => setSecretFound(true)} onShuffle={() => { setNoteOrder((items) => [...items].sort(() => Math.random() - 0.5)); setActiveNote(null); }} onContinue={next} />}
        {scene === 4 && <WishScene candles={candles} celebrated={celebrated} onBlow={(index) => { playTone(349.23); setCandles((items) => items.map((lit, candle) => candle === index ? false : lit)); }} onRelight={() => { setCandles([true, true, true]); setCelebrated(false); }} onCelebrate={burstConfetti} onContinue={next} />}
        {scene === 5 && <LetterScene text={letter} chars={letterChars} complete={letterComplete} onShowAll={() => { setLetterChars(letter.length); setLetterComplete(true); }} onContinue={next} />}
        {scene === 6 && <FinalScene revealed={secretEnding} onReveal={() => { setSecretEnding(true); burstConfetti(65); playTone(783.99); }} onReplay={replay} name={friendName} />}
      </div>
      {selectedPhoto !== null && <PhotoModal index={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      {scene !== 0 && !isFinalNight && <footer className="relative z-10 px-6 pb-5 text-center font-hand text-xl text-muted-foreground">A little world made for you <span className="text-accent">♡</span></footer>}
    </main>
  );
}

function UtilityBar({ musicOn, muteEffects, onMusic, onMute, onReplay }: { musicOn: boolean; muteEffects: boolean; onMusic: () => void; onMute: () => void; onReplay: () => void }) {
  return <header className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-7 sm:top-6">
    <Button variant="outline" size="sm" onClick={onMusic} aria-label={musicOn ? "Pause background music" : "Play soft background music"} title={musicOn ? "Pause music" : "Play soft music"} className="size-9 bg-background/80 p-0 backdrop-blur-sm">{musicOn ? <Pause /> : <Music2 />}</Button>
    <Button variant="outline" size="sm" onClick={onMute} aria-label={muteEffects ? "Enable sound effects" : "Mute sound effects"} title={muteEffects ? "Enable sound effects" : "Mute sound effects"} className="size-9 bg-background/80 p-0 backdrop-blur-sm">{muteEffects ? <VolumeX /> : <Volume2 />}</Button>
    <Button variant="outline" size="sm" onClick={onReplay} aria-label="Replay from the beginning" title="Replay" className="size-9 bg-background/80 p-0 backdrop-blur-sm"><RotateCcw /></Button>
  </header>;
}

function ProgressRail({ scene, completed, onJump }: { scene: Scene; completed: number; onJump: (scene: Scene) => void }) {
  return <nav aria-label="Birthday surprises" className="fixed bottom-3 left-1/2 z-30 flex w-[min(94vw,760px)] -translate-x-1/2 items-center gap-3 rounded-full border border-border/80 bg-background/90 px-4 py-2.5 shadow-lg backdrop-blur-md sm:bottom-5 sm:px-5">
    <span className="hidden whitespace-nowrap font-hand text-lg text-muted-foreground sm:block">a little trail of surprises</span>
    <div className="flex min-w-0 flex-1 items-center gap-1.5" aria-label={`${completed} of 8 surprises opened`}>
      {surpriseNames.map((name, index) => <button key={name} type="button" onClick={() => index + 1 <= scene && onJump((index + 1) as Scene)} title={name} aria-label={`${name}${index + 1 <= scene ? ", visit" : ", not opened yet"}`} disabled={index + 1 > scene} className={`h-1.5 flex-1 rounded-full transition-colors disabled:cursor-default ${index + 1 <= scene ? "bg-accent" : "bg-border"}`} />)}
    </div>
    <span className="min-w-8 text-right text-xs text-muted-foreground">{String(scene).padStart(2, "0")}<span className="mx-0.5">/</span>07</span>
  </nav>;
}

function MusicPlayer({ onClose }: { onClose: () => void }) {
  return <aside className="fixed right-4 top-16 z-40 w-[min(240px,calc(100vw-2rem))] overflow-hidden border border-border bg-card shadow-[var(--shadow-soft)]" aria-label="Birthday song">
    <div className="flex h-9 items-center justify-between px-3"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Music2 className="size-3.5 text-accent" /> your birthday song</span><Button variant="ghost" size="icon" onClick={onClose} aria-label="Pause and close music player" className="size-7"><Pause className="size-3.5" /></Button></div>
    <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 text-center">
      <span className="text-3xl text-accent animate-pulse">♪</span>
      <p className="mt-2 font-hand text-lg text-foreground">Sweet Music Box</p>
      <p className="text-[11px] text-muted-foreground">Playing softly in background ♡</p>
    </div>
  </aside>;
}

function SparkleTrail({ sparkles }: { sparkles: { id: number; x: number; y: number }[] }) {
  return <div className="pointer-events-none fixed inset-0 z-20" aria-hidden="true">{sparkles.map((item) => <Sparkles key={item.id} className="cursor-sparkle absolute size-3 text-[var(--color-gold)]" style={{ left: item.x, top: item.y }} />)}</div>;
}

function Confetti({ confetti }: { confetti: { id: number; x: number; delay: number }[] }) {
  return <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">{confetti.map((piece) => <span key={piece.id} className={`confetti-piece absolute top-0 h-3 w-2 ${["bg-accent", "bg-secondary", "bg-[var(--color-gold)]", "bg-primary", "bg-[var(--color-paper-deep)]"][piece.id % 5]}`} style={{ left: `${piece.x}%`, animationDelay: `${piece.delay}ms`, ["--confetti-x" as string]: `${((piece.id * 19) % 260) - 130}px` }} />)}</div>;
}

function SceneFrame({ number, label, title, subtitle, children, dark = false }: { number: string; label: string; title: ReactNode; subtitle?: string; children: ReactNode; dark?: boolean }) {
  return <section className={`scene-shell relative flex flex-col items-center justify-center px-5 pb-24 pt-24 text-center sm:px-8 ${dark ? "text-background" : ""}`}>
    <div className="mb-8 flex items-center gap-3 font-hand text-xl text-accent"><span>{number}</span><span className="h-px w-10 bg-accent/60" /><span>{label}</span></div>
    <h1 className={`font-display text-5xl leading-[0.96] sm:text-6xl md:text-7xl ${dark ? "text-background" : "text-foreground"}`}>{title}</h1>
    {subtitle && <p className={`mt-4 max-w-xl text-sm leading-7 sm:text-base ${dark ? "text-background/70" : "text-muted-foreground"}`}>{subtitle}</p>}
    {children}
  </section>;
}

function EnvelopeScene({ open, onOpen, name }: { open: boolean; onOpen: () => void; name: string }) {
  return <section className="scene-shell relative flex flex-col items-center justify-center overflow-hidden px-5 py-10 text-center" style={{ backgroundImage: `linear-gradient(oklch(0.982 0.019 78 / 82%), oklch(0.982 0.019 78 / 88%)), url(${stilllife})`, backgroundSize: "cover", backgroundPosition: "center" }}>
    <div className="absolute left-[9%] top-[17%] hidden rotate-[-15deg] text-5xl text-accent/60 sm:block" aria-hidden="true">✧</div><div className="absolute bottom-[15%] right-[10%] hidden rotate-[12deg] font-hand text-4xl text-[var(--color-gold)] sm:block" aria-hidden="true">for you ♡</div>
    <div className="relative z-10 mb-10">
      <p className="mb-5 font-hand text-2xl text-accent">a tiny something, just because</p>
      <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">I have a<br />little surprise for you<span className="text-accent">…</span></h1>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">a little world made with care</p>
    </div>
    <div className={`relative h-60 w-[min(82vw,390px)] perspective-[900px] sm:h-[275px] ${open ? "envelope-open" : ""}`}>
      <div className="envelope-pocket pressed-paper absolute inset-0 z-[1] rounded-sm" />
      <div className="envelope-letter paper-surface absolute left-[9%] top-[7%] z-[2] flex h-[82%] w-[82%] flex-col items-center justify-center border border-border/70 px-6">
        <span className="font-hand text-xl text-muted-foreground">dear {name},</span><Heart className="mt-3 size-7 fill-accent/25 text-accent" /><span className="mt-3 font-display text-2xl italic">open when ready</span>
      </div>
      <div className="envelope-flap absolute inset-x-0 top-0 z-[3] h-[68%] bg-secondary" aria-hidden="true" />
      <Button onClick={onOpen} disabled={open} aria-label="Break the wax seal and open the birthday surprise" className="wax-seal absolute left-1/2 top-[43%] z-[4] size-[76px] -translate-x-1/2 rounded-full border border-accent/70 bg-[var(--color-rose)] p-0 text-background transition-transform hover:scale-105 active:scale-95">
        {open ? <Sparkles className="size-7" /> : <Heart className="size-7 fill-background/35" />}
      </Button>
      <span className="absolute -bottom-9 left-0 w-full font-hand text-lg text-muted-foreground">tap the little seal to open</span>
    </div>
    <span className="absolute bottom-8 flex items-center gap-2 font-hand text-lg text-muted-foreground"><Sparkles className="size-4 text-[var(--color-gold)]" /> made especially for {name}</span>
  </section>;
}

function WelcomeScene({ open, name, onOpen, onContinue }: { open: boolean; name: string; onOpen: () => void; onContinue: () => void }) {
  return <SceneFrame number="01" label="today is all about you" title={<>Happy birthday,<br /><span className="italic text-accent">Rajesh.</span></>} subtitle="A whole little world, made especially for you. Take your time. There's no rush.">
    <div className="mt-11 flex flex-col items-center gap-8 sm:flex-row sm:gap-14">
      <Button variant="ghost" aria-label={open ? "The birthday gift is open" : "Open the birthday gift"} onClick={onOpen} className={`group relative flex h-40 w-44 items-center justify-center bg-transparent p-0 ${open ? "gift-open" : ""}`}>
        <span className="relative mt-7 h-24 w-32 border-x-2 border-b-2 border-[var(--color-gold)] bg-accent/75 shadow-[var(--shadow-paper)]"><span className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 bg-[var(--color-gold)]" /><span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-background/70" />
          <span className="gift-lid absolute -inset-x-2 -top-3 z-10 h-5 border border-[var(--color-gold)] bg-secondary shadow-sm"><span className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 bg-[var(--color-gold)]" /></span>
          <span className="absolute -top-16 left-1/2 z-20 -translate-x-1/2 font-hand text-5xl text-accent opacity-0 transition-all duration-500 group-[.gift-open]:-translate-y-10 group-[.gift-open]:opacity-100" aria-hidden="true">✧</span>
        </span>
        <span className="absolute bottom-0 w-full text-center font-hand text-lg text-muted-foreground">{open ? "a little wish for you" : "tap to open your gift"}</span>
      </Button>
      <div className={`paper-surface max-w-sm border border-border/70 px-7 py-6 text-left transition-all duration-500 sm:px-9 ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-50"}`}>
        <p className="font-hand text-xl text-accent">{open ? "a note, just for you" : "there's something inside…"}</p>
        <p className="mt-3 font-display text-2xl leading-snug">{open ? "I hope today brings you a hundred small reasons to smile." : "A little birthday wish is waiting to be found."}</p>
        {open && <p className="mt-3 font-hand text-xl text-muted-foreground">Happy birthday, {name} ♡</p>}
      </div>
    </div>
    <ContinueButton className="mt-10" onClick={onContinue}>let's wander a little <ArrowRight className="size-4" /></ContinueButton>
  </SceneFrame>;
}

function MemoriesScene({ flipped, onFlip, onPhoto, onContinue }: { flipped: number[]; onFlip: (index: number) => void; onPhoto: (index: number) => void; onContinue: () => void }) {
  const [milestone, setMilestone] = useState(0);
  return <SceneFrame number="02" label="little pieces of time" title="Our little memories" subtitle="A few blank little places for the moments that are yours. Tap a photo, or turn one over for a note.">
    <div className="mt-10 grid w-full max-w-5xl grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 sm:gap-x-7">
      {memories.map((memory, index) => <div key={memory.caption} className="flip-dialog">
        <div className={`polaroid-flip relative mx-auto aspect-[0.78] w-full max-w-[215px] cursor-pointer ${flipped.includes(index) ? "is-flipped" : ""}`}>
          <div className="polaroid polaroid-front absolute inset-0 bg-card p-2 pb-11 sm:p-3 sm:pb-14" onClick={() => onPhoto(index)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPhoto(index); } }} aria-label={`Enlarge photo: ${memory.caption}`}>
            {memory.image ? <img src={`/${memory.image}`} alt={memory.caption} className="relative z-10 h-full w-full bg-muted object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
            {!memory.image && <div className="absolute inset-x-2 top-2 bottom-11 flex flex-col items-center justify-center gap-2 bg-secondary/45 px-2 text-center text-foreground/80 sm:inset-x-3 sm:top-3 sm:bottom-14">
              <span className="text-3xl text-accent">✿</span><span className="font-hand text-sm">your photo here</span><span className="max-w-full break-all px-1 text-[9px] text-muted-foreground">public/{memory.image}</span>
            </div>}
            <span className="absolute inset-x-2 bottom-2 overflow-hidden text-ellipsis whitespace-nowrap font-hand text-lg sm:inset-x-3 sm:bottom-3 sm:text-xl">{memory.caption}</span>
          </div>
          <button type="button" className="polaroid-back polaroid absolute inset-0 flex flex-col items-center justify-center bg-card px-4 text-center" onClick={() => onFlip(index)} aria-label={`Turn over photo ${index + 1}`}>
            <Heart className="mb-3 size-5 fill-accent/15 text-accent" /><p className="font-hand text-xl leading-snug text-foreground">{memory.note}</p><span className="mt-4 text-xs text-muted-foreground">tap to turn back</span>
          </button>
        </div>
        <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" onClick={() => onFlip(index)}>{flipped.includes(index) ? "show the photo" : "turn this one over"}</Button>
      </div>)}
    </div>
    <div className="mt-10 flex w-full max-w-2xl flex-col items-center">
      <div className="relative h-1 w-full bg-border"><span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[var(--color-gold)] bg-background transition-[left]" style={{ left: `${milestone * 33.333}%` }} /></div>
      <div className="mt-3 grid w-full grid-cols-3 font-hand text-base text-muted-foreground"><span>the beginning</span><span className="text-center">the in-between</span><span className="text-right">what comes next</span></div>
      <div className="mt-3 flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => setMilestone((value) => Math.max(0, value - 1))} aria-label="Previous timeline moment" disabled={milestone === 0}><ArrowLeft /></Button><span className="min-w-[126px] font-hand text-lg text-accent">{["a lovely beginning", "all the little things", "more good days ahead"][milestone]}</span><Button size="sm" variant="outline" onClick={() => setMilestone((value) => Math.min(2, value + 1))} aria-label="Next timeline moment" disabled={milestone === 2}><ArrowRight /></Button></div>
    </div>
    <ContinueButton className="mt-9" onClick={onContinue}>a few more little things <ArrowRight className="size-4" /></ContinueButton>
  </SceneFrame>;
}

function PhotoModal({ index, onClose }: { index: number; onClose: () => void }) {
  const memory = memories[index];
  if (!memory) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-5 backdrop-blur-sm" role="presentation" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={`Photo: ${memory.caption}`} className="paper-surface relative w-full max-w-lg p-4 pb-8" onClick={(event) => event.stopPropagation()}>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close enlarged photo" className="absolute -right-2 -top-2 z-10 rounded-full bg-background shadow"><X /></Button>
      <div className="relative flex aspect-[4/3] items-center justify-center bg-secondary/45 text-center"><div className="text-center"><span className="text-5xl text-accent">✿</span><p className="mt-3 font-hand text-xl">your photo here</p><p className="break-all px-2 text-xs text-muted-foreground">public/{memory.image}</p></div>{memory.image && <img src={`/${memory.image}`} alt={memory.caption} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</div>
      <p className="mt-4 text-center font-hand text-2xl">{memory.caption}</p>
    </div>
  </div>;
}

function NotesScene({ activeNote, opened, order, secretFound, onPick, onRandom, onSecret, onShuffle, onContinue }: { activeNote: number | null; opened: number[]; order: number[]; secretFound: boolean; onPick: (index: number) => void; onRandom: () => void; onSecret: () => void; onShuffle: () => void; onContinue: () => void }) {
  return <SceneFrame number="03" label="a pocketful of kind things" title="Little things I appreciate" subtitle="Choose any folded note, or let the jar find one for you.">
    <div className="mt-8 flex w-full max-w-4xl flex-col items-center gap-9 md:flex-row md:items-center md:justify-center md:gap-12">
      <div className="relative flex h-[340px] w-[290px] shrink-0 items-end justify-center pb-6">
        <div className="jar-glass absolute bottom-5 h-[282px] w-[210px] rounded-b-[42px] rounded-t-[30px] border border-border/60">
          <div className="absolute -top-3 left-[16%] h-6 w-[68%] rounded-[5px] border border-border/70 bg-secondary/70" />
          <div className="absolute -top-8 left-[23%] h-5 w-[54%] rounded-t-lg border border-border bg-secondary" />
          <div className="absolute inset-x-5 bottom-3 top-5 flex flex-wrap-reverse items-end justify-center gap-1.5 overflow-hidden p-2">
            {order.map((index) => <button key={index} onClick={() => onPick(index)} aria-label={`Open folded note ${index + 1}${opened.includes(index) ? ", read again" : ""}`} className={`flex h-10 w-12 items-center justify-center border border-[var(--color-gold)]/60 bg-[var(--color-paper)] shadow-sm transition-all duration-500 hover:-translate-y-1 ${opened.includes(index) ? "rotate-[-7deg]" : "rotate-[4deg]"}`}><span className="font-hand text-sm text-accent">♡</span></button>)}
          </div>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-hand text-2xl text-primary/70">little good things</span>
          <span className="absolute left-5 top-8 h-24 w-2 rounded-full bg-background/40" />
        </div>
        <div className="absolute -left-2 top-8 rotate-[-9deg] font-hand text-3xl text-accent/70" aria-hidden="true">✳</div><div className="absolute -right-1 top-20 rotate-[9deg] font-hand text-4xl text-[var(--color-gold)]" aria-hidden="true">✧</div>
      </div>
      <div className="w-full max-w-md text-center md:text-left">
        <p className="mb-4 font-hand text-2xl text-accent">a note, chosen just for you</p>
        <div aria-live="polite" className="paper-surface flex min-h-32 items-center justify-center border border-border/70 px-6 py-6 text-center md:px-8">
          {activeNote !== null ? <p key={activeNote} className="secret-reveal font-display text-2xl italic leading-snug">{appreciationNotes[activeNote]}</p> : <p className="font-hand text-xl text-muted-foreground">A little kind thought is folded inside each one.</p>}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start"><Button onClick={onRandom}>pick a little note <Sparkles /></Button><Button variant="outline" onClick={onShuffle}>stir the jar <RotateCcw /></Button></div>
        <div className="mt-8 border-t border-border pt-5">
          {secretFound ? <div className="secret-reveal paper-surface border border-border/70 p-5"><p className="font-hand text-xl text-accent">the secret note, saved for last ♡</p><p className="mt-2 font-display text-xl leading-snug">{secretNote}</p></div> : <Button variant="ghost" onClick={onSecret} className="font-hand text-xl text-muted-foreground">psst… is there a secret one? <span className="text-accent">♡</span></Button>}
        </div>
      </div>
    </div>
    <ContinueButton className="mt-6" onClick={onContinue}>let's make a wish <ArrowRight className="size-4" /></ContinueButton>
  </SceneFrame>;
}

function WishScene({ candles, celebrated, onBlow, onRelight, onCelebrate, onContinue }: { candles: boolean[]; celebrated: boolean; onBlow: (index: number) => void; onRelight: () => void; onCelebrate: (amount?: number) => void; onContinue: () => void }) {
  return <SceneFrame number="04" label="a wish is waiting" title="Make a wish" subtitle="Close your eyes. Pick a little wish. Tap each candle when you’re ready.">
    <div className="relative mt-12 flex min-h-[245px] w-72 flex-col items-center justify-end pb-6" aria-label={`${candles.filter(Boolean).length} candles still lit`}>
      <div className="mb-[-2px] flex h-28 items-end justify-center gap-4">
        {candles.map((lit, index) => <Button key={index} variant="ghost" onClick={() => lit && onBlow(index)} aria-label={lit ? `Blow out candle ${index + 1}` : `Candle ${index + 1} is out`} className="relative h-28 w-10 p-0 disabled:opacity-100" disabled={!lit}>
          {lit && <span className="candle-flame absolute left-1/2 top-0 -translate-x-1/2 text-xl text-[var(--color-gold)]" aria-hidden="true">♦</span>}
          <span className={`absolute bottom-0 left-1/2 h-[74px] w-[14px] -translate-x-1/2 rounded-t-sm border border-accent/30 ${lit ? "bg-accent/80" : "bg-muted"}`}><span className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 -translate-y-2 bg-foreground/70" /></span>
        </Button>)}
      </div>
      <div className="relative z-10 h-12 w-[225px] rounded-[50%] border border-accent/60 bg-secondary shadow-[var(--shadow-paper)]"><span className="absolute inset-x-5 bottom-1 h-5 rounded-[50%] bg-accent/20" /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-hand text-lg text-primary">make a little wish</span></div>
      <div className="-mt-1 h-16 w-[185px] rounded-b-[22px] rounded-t-[10px] border-x border-b border-accent/70 bg-accent/35 shadow-[var(--shadow-paper)]"><span className="mt-5 block text-center font-hand text-2xl text-primary/70">for your day ♡</span></div>
      <div className="-mt-1 h-4 w-[204px] rounded-full bg-secondary shadow-[var(--shadow-paper)]" />
    </div>
    {celebrated && <div className="secret-reveal mt-2" role="status"><p className="font-hand text-3xl text-accent">I hope all your wishes come true! <span className="text-[var(--color-gold)]">✧</span></p><p className="mt-1 text-sm text-muted-foreground">A whole year of lovely things, waiting for you.</p></div>}
    <div className="mt-6 flex flex-wrap justify-center gap-2">{celebrated ? <Button variant="outline" onClick={() => { onRelight(); onCelebrate(55); }}>celebrate again <RotateCcw /></Button> : <p className="font-hand text-lg text-muted-foreground">{candles.filter(Boolean).length} little wishes left</p>}</div>
    <ContinueButton className="mt-9" onClick={onContinue}>one last little game <ArrowRight className="size-4" /></ContinueButton>
  </SceneFrame>;
}

function LetterScene({ text, chars, complete, onShowAll, onContinue }: { text: string; chars: number; complete: boolean; onShowAll: () => void; onContinue: () => void }) {
  const visible = complete ? text : text.slice(0, chars);
  return <SceneFrame number="05" label="a few things from the heart" title="Before you go…" subtitle="A little letter, sent all the way to you.">
    <article className="paper-surface relative mt-8 w-full max-w-2xl border border-border/70 px-6 py-8 text-left sm:px-12 sm:py-10" style={{ backgroundImage: `linear-gradient(oklch(0.982 0.019 78 / 91%), oklch(0.982 0.019 78 / 93%)), url(${stilllife})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <span className="absolute right-5 top-4 rotate-12 text-3xl text-accent/70" aria-hidden="true">✧</span>
      <div aria-live="polite"><pre className="whitespace-pre-wrap break-words font-hand text-[22px] leading-[1.7] text-foreground sm:text-2xl">{visible}{!complete && <span className="type-caret ml-0.5 inline-block h-5 w-px translate-y-1 bg-accent" />}</pre>{!complete && <Button variant="ghost" size="sm" className="mt-2 font-hand text-lg text-muted-foreground" onClick={onShowAll}>read the rest <ArrowDown /></Button>}</div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4"><span className="font-hand text-xl text-muted-foreground">Made with a little extra care, just for you. ♡</span></div>
    </article>
    <ContinueButton className="mt-8" onClick={onContinue}>wait… one last surprise? <ArrowRight className="size-4" /></ContinueButton>
  </SceneFrame>;
}

function FinalScene({ revealed, onReveal, onReplay, name }: { revealed: boolean; onReveal: () => void; onReplay: () => void; name: string }) {
  return <section className="scene-shell relative flex flex-col items-center justify-center overflow-hidden px-6 py-14 text-center">
    <div className="absolute left-[14%] top-[18%] rotate-12 font-hand text-4xl text-[var(--color-gold)]/70" aria-hidden="true">✧</div><div className="absolute right-[15%] top-[27%] -rotate-12 text-3xl text-accent/80" aria-hidden="true">✦</div>
    {!revealed ? <div className="scene-content"><p className="mb-4 font-hand text-2xl text-[var(--color-gold)]">p.s. you found all the way to the end</p><h1 className="font-display text-5xl text-background sm:text-6xl">One last surprise?</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-background/75">Just one more little thing, before the stars take you home.</p><Button onClick={onReveal} className="mt-9 border border-[var(--color-gold)]/70 bg-[var(--color-gold)] px-6 text-primary-foreground hover:bg-[var(--color-gold)]/90">wait… one last surprise? <Sparkles /></Button></div> : <div className="secret-reveal max-w-2xl">
      <p className="font-hand text-2xl text-[var(--color-gold)]">a tiny truth, for you ♡</p>
      <h1 className="mt-4 font-display text-5xl text-background sm:text-6xl">You make this<br /><span className="italic text-[var(--color-rose)]">little world brighter.</span></h1>
      <p className="mt-5 font-display text-xl leading-relaxed text-background/80">Thank you for being someone I can laugh with, fight with, and still never want to lose.</p>
      <div className="hug-arms mx-auto mt-8 flex h-28 w-36 items-center justify-center" aria-label="A virtual hug" role="img"><span className="relative flex size-20 items-center justify-center rounded-full border border-[var(--color-gold)]/55 bg-background/10 text-4xl text-[var(--color-rose)]"><Heart className="absolute size-10 fill-[var(--color-rose)]/30" /><span className="relative z-10">♡</span><span className="absolute -left-8 top-7 h-6 w-12 rotate-[-34deg] rounded-full border-2 border-[var(--color-gold)]/80" /><span className="absolute -right-8 top-7 h-6 w-12 rotate-[34deg] rounded-full border-2 border-[var(--color-gold)]/80" /></span></div>
      <p className="mt-2 font-hand text-2xl text-[var(--color-gold)]">a very big, very virtual hug</p>
      <Button onClick={onReplay} variant="outline" className="mt-9 border-background/50 bg-background/10 text-background hover:bg-background/20 hover:text-background">take me through it again <RotateCcw /></Button>
    </div>}
    <span className="absolute bottom-7 font-hand text-lg text-background/50">made with a little extra care, just for {name} ♡</span>
  </section>;
}

function ContinueButton({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick: () => void }) {
  return <Button variant="outline" onClick={onClick} className={`border-accent/45 bg-card/75 px-5 font-medium hover:border-accent hover:bg-secondary/55 ${className}`}>{children}</Button>;
}
