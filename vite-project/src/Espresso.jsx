import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";

import character from "./assets/character.png";
import logo from "./assets/espressoCharacter.png";
import jumpSoundFile from "./assets/jump.mp3";
import gameOverSoundFile from "./assets/gameOver.mp3";

// Obstacles
import obs1 from "./assets/cofeeMaker1.png";
import obs2 from "./assets/obs_2.png";
import obs3 from "./assets/obs_3.png";
import obs4 from "./assets/obs_4.png";
import obs5 from "./assets/obs_5.png";

//logo
import EspressoLogo from "./assets/Logo.png"

export default function JumpGame() {
  const [characterBottom, setCharacterBottom] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    () => Number(localStorage.getItem("highScore")) || 0
  );
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [obstacleSpeed, setObstacleSpeed] = useState(11);
  const [hasStarted, setHasStarted] = useState(false);

  const lastMilestoneRef = useRef(0);
  const maxSpeed = 20;

  const baseGravity = 0.2;
  const jumpVelocity = 9;
  const groundLevel = 0;
  const maxJumpHeight = 250;

  const isHoldingJump = useRef(false);
  const jumpSound = useRef(null);
  const gameOverSound = useRef(null);

  const obstacleImages = [obs1, obs2, obs3, obs4, obs5];

  const getRandomHeight = () => Math.floor(Math.random() * 60) + 70;
  const getRandomObs = () =>
    obstacleImages[Math.floor(Math.random() * obstacleImages.length)];

  const spawnObstacles = (offset = 0) => {
    const numGroups = Math.floor(Math.random() * 3) + 1;
    const obstacleGap = 60;
    let newObstacles = [];
    let currentX = 1100 + offset;
    let groupIdCounter = Date.now(); // unique per spawn call

    for (let g = 0; g < numGroups; g++) {
      const groupSize = Math.floor(Math.random() * 3) + 1;
      const groupSpacing = 500;

      for (let i = 0; i < groupSize; i++) {
        newObstacles.push({
          left: currentX + i * obstacleGap,
          height: getRandomHeight(),
          img: getRandomObs(),
          groupId: groupIdCounter + g, // tag group
          passed: false,
        });
      }
      currentX += groupSpacing;
    }
    return newObstacles;
  };

  const resetGame = () => {
    // Handle reset game
    setCharacterBottom(groundLevel);
    setObstacles(spawnObstacles());
    setIsGameOver(false);
    setScore(0);
    setObstacleSpeed(11);
  };

  useEffect(() => {
    // Handle obstacle speed every 20
    if (
      score > 0 &&
      score % 20 === 0 &&
      score !== lastMilestoneRef.current &&
      obstacleSpeed < maxSpeed
    ) {
      setObstacleSpeed((prev) => Math.min(prev + 2, maxSpeed));
      lastMilestoneRef.current = score;
    }
  }, [score, obstacleSpeed]);

  const jump = () => {
    // handle character jump
    if (
      !isJumping &&
      !isGameOver &&
      characterBottom === groundLevel &&
      hasStarted
    ) {
      jumpSound.current?.play();
      setIsJumping(true);
      let velocity = jumpVelocity;
      let position = characterBottom;

      const animation = () => {
        const gravity = baseGravity * (obstacleSpeed / 11);

        if (isHoldingJump.current && position < maxJumpHeight) {
          velocity -= gravity * 0.4;
        } else {
          velocity -= gravity;
        }

        position += velocity;

        if (position <= groundLevel) {
          position = groundLevel;
          setCharacterBottom(position);
          setIsJumping(false);
          return;
        }

        setCharacterBottom(position);
        requestAnimationFrame(animation);
      };

      requestAnimationFrame(animation);
    }
  };

  useEffect(() => {
    if (!isGameOver && hasStarted) {
      const timer = setInterval(() => {
        setObstacles((prev) => {
          let updated = prev.map((obs) => ({
            ...obs,
            left: obs.left - obstacleSpeed,
          }));

          updated.forEach((obs) => {
            if (obs.left + 60 < 50 && !obs.passed) {
              obs.passed = true;

              // Check if this is the LAST obstacle in its group to pass
              const groupPassed = updated
                .filter((o) => o.groupId === obs.groupId)
                .every((o) => o.passed);

              if (groupPassed) {
                setScore((s) => s + 2); // +2 points per group
                setObstacleSpeed((speed) => Math.min(speed + 0.05, maxSpeed));
              }
            }
          });

          updated = updated.filter((obs) => obs.left > -60);

          const rightmost = Math.max(...updated.map((o) => o.left), 0);
          if (rightmost < 400) {
            updated = [...updated, ...spawnObstacles()];
          }

          return updated;
        });
      }, 30);

      return () => clearInterval(timer);
    }
  }, [isGameOver, obstacleSpeed, hasStarted]);

  useEffect(() => {
    const checkCollision = (obsLeft, obsHeight) => {
      return obsLeft < 80 && obsLeft > 20 && characterBottom < obsHeight + 50;
    };

    if (
      obstacles.some((obs) => checkCollision(obs.left, obs.height)) &&
      !isGameOver &&
      hasStarted
    ) {
      gameOverSound.current?.play();
      setIsGameOver(true);

      if (score > highScore) {
        localStorage.setItem("highScore", score);
        setHighScore(score);
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }
    }
  }, [obstacles, characterBottom, isGameOver, hasStarted, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        isHoldingJump.current = true;
        if (!isJumping) jump();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        isHoldingJump.current = false;
      }
      if (e.code === "Enter") {
        if (!hasStarted) {
          setHasStarted(true);
          setObstacles(spawnObstacles());
        } else if (isGameOver) {
          resetGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isJumping, isGameOver, hasStarted]);

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#CABCB2]">
      <div className="bg-[#c0b1a5] px-2 rounded-sm flex gap-2 relative">
        <div
          className={clsx(
            "relative w-[1100px] h-[600px] overflow-hidden rounded-sm mx-auto",
            "bg-[#451f17]"
          )}
        >
          <audio ref={jumpSound} src={jumpSoundFile} preload="auto" />
          <audio ref={gameOverSound} src={gameOverSoundFile} preload="auto" />

          {/* Character */}
          <img
            src={character}
            alt="character"
            className="absolute object-contain left-[50px] w-[60px] h-[70px]"
            style={{ bottom: `${characterBottom}px` }}
          />

          {/* Obstacles */}
          {obstacles.map((obs, idx) => (
            <img
              key={idx}
              src={obs.img}
              alt={`Obstacle ${idx}`}
              className="absolute bottom-0 w-[60px]"
              style={{
                left: `${obs.left}px`,
                height: "100px",
              }}
            />
          ))}

          {/* Score */}
          <div className="w-full absolute top-0 py-3 flex justify-between px-3">
            <div>
              <div className="flex gap-2 justify-center items-center px-2 py-1 border-3 border-[#DE9E67] rounded-sm">
                <span className="text-lg   text-[#B67237] flex flex-col justify-center items-center gap-2 helvetica">
                  Highest Score:
                </span>
                <span className="text-lg font-bold text-white flex justify-center items-center gap-2 hel-bold">
                  {highScore}
                </span>
              </div>
              <span className="text-lg font-bold px-2 py-1 border-3 rounded-sm border-[#DE9E67] mt-2 w-20 text-white flex justify-center items-center gap-2 helvetica">
                <img src={logo} className="w-7 h-7" alt="" /> {score}
              </span>
            </div>
            <div>
              <img src={EspressoLogo} alt="Espresso Logo"  className="w-40"/>
            </div>
          </div>

          {/* Game Over */}
          {isGameOver && (
            <div className="w-full h-full text-center flex flex-col mt-5 justify-center items-center ">
              <span className="text-4xl font-bold text-[#B67237] helvetica">
                GAME OVER
              </span>
              <br />
              <span className="text-lg helvetica-normal text-[#B67237] blink">
                Press <strong>[ Enter ] </strong> to Retry
              </span>
              {isNewHighScore && (
                <div className="text-lg  text-white mt-2 helvetica-normal">
                  🎉 New Highest Score! 🎉
                </div>
              )}
              <span className="text-[25px] font-bold text-white flex justify-center mt-2 items-center gap-2 helvetica">
                <img src={logo} className="w-7 h-7" alt="" /> {score}
              </span>
            </div>
          )}

          {/* Start Screen */}
          {!hasStarted && (
            <div className="absolute left-0 w-full h-full flex flex-col justify-center items-center text-white z-10">
              <p className="text-4xl font-bold text-[#B67237] mb-4 blink helvetica title">
                Espresso Escape
              </p>
              <p className="text-lg text-[#B67237] blink helvetica-normal">
                Press <strong>[ Enter ]</strong> to Start
              </p>
            </div>
          )}
        </div>

        <div className="absolute w-full bottom-[-30px] text-center  blink">
          <span className="text-[#B67237] text-xl helvetica-normal">
            Hold <strong className="">[ Space ]</strong> to jump higher
          </span>
        </div>
      </div>
    </div>
  );
}
