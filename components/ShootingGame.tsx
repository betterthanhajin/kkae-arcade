"use client";
import React, { useEffect, useRef } from "react";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  image?: HTMLImageElement;
}

interface GameState {
  player: GameObject;
  enemies: GameObject[];
  bullets: GameObject[];
  score: number;
  lives: number;
  gameOver: boolean;
}

const ShootingGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const enemyImageRef = useRef<HTMLImageElement | null>(null);
  const movementRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const gameStateRef = useRef<GameState>({
    player: {
      x: 375, // 캔버스 가로 중앙 (800/2 - 플레이어 너비/2)
      y: 520, // 캔버스 높이(600) - 플레이어 높이(50) - 여백(30)
      width: 80,
      height: 80,
      speed: 25,
    },
    enemies: [],
    bullets: [],
    score: 0,
    lives: 3,
    gameOver: false,
  });

  // 이미지 로드
  useEffect(() => {
    // 플레이어(하얀 물개) 이미지 로드
    const playerImage = new Image();
    playerImage.src = "/images/white-seal.png";
    playerImage.onload = () => {
      playerImageRef.current = playerImage;
    };

    // 적(검은 물개) 이미지 로드
    const enemyImage = new Image();
    enemyImage.src = "/images/black-seal.png";
    enemyImage.onload = () => {
      enemyImageRef.current = enemyImage;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault(); // 기본 우클릭 메뉴 방지

      // 왼쪽 클릭
      if (e.button === 0) {
        movementRef.current.left = true;
      }
      // 오른쪽 클릭
      else if (e.button === 2) {
        movementRef.current.right = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // 왼쪽 클릭
      if (e.button === 0) {
        movementRef.current.left = false;
      }
      // 오른쪽 클릭
      else if (e.button === 2) {
        movementRef.current.right = false;
      }
    };

    // 우클릭 메뉴 방지
    const preventDefault = (e: Event) => e.preventDefault();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", preventDefault);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", preventDefault);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const player = gameStateRef.current.player;
      const canvas = canvasRef.current;
      if (!canvas) return;

      switch (e.key) {
        case "ArrowLeft":
          player.x = Math.max(0, player.x - player.speed);
          break;
        case "ArrowRight":
          player.x = Math.min(
            canvas.width - player.width,
            player.x + player.speed
          );
          break;
        case "Enter":
          // 총알 발사 위치 수정 - 플레이어 위에서 발사
          gameStateRef.current.bullets.push({
            x: player.x + player.width / 2 - 2.5, // 총알 너비의 절반만큼 보정
            y: player.y, // 플레이어의 위치에서 시작
            width: 5,
            height: 10,
            speed: 7,
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      if (gameStateRef.current.gameOver) return;

      // 플레이어 이동 처리
      const player = gameStateRef.current.player;
      if (movementRef.current.left) {
        player.x = Math.max(0, player.x - player.speed);
      }
      if (movementRef.current.right) {
        player.x = Math.min(
          canvas.width - player.width,
          player.x + player.speed
        );
      }

      // 화면 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 플레이어 그리기
      if (playerImageRef.current) {
        ctx.drawImage(
          playerImageRef.current,
          player.x,
          player.y,
          player.width,
          player.height
        );
      }

      // 적 생성 (랜덤)
      if (Math.random() < 0.02) {
        gameStateRef.current.enemies.push({
          x: Math.random() * (canvas.width - 30),
          y: -30,
          width: 50,
          height: 50,
          speed: 2,
        });
      }

      // 적 이동 및 그리기
      gameStateRef.current.enemies = gameStateRef.current.enemies.filter(
        (enemy) => {
          enemy.y += enemy.speed;

          if (enemyImageRef.current) {
            ctx.drawImage(
              enemyImageRef.current,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            );
          }

          // 충돌 체크 및 게임오버 처리
          if (
            enemy.y + enemy.height > player.y &&
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x
          ) {
            gameStateRef.current.lives--;
            if (gameStateRef.current.lives <= 0) {
              gameStateRef.current.gameOver = true;
            }
            return false;
          }

          return enemy.y < canvas.height;
        }
      );
      // 총알 이동 및 그리기 - 위로 발사되도록 수정
      gameStateRef.current.bullets = gameStateRef.current.bullets.filter(
        (bullet) => {
          bullet.y -= bullet.speed; // 위로 이동
          ctx.fillStyle = "blue";
          ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

          // 적과 총알 충돌 체크 (동일)...
          const hitEnemy = gameStateRef.current.enemies.find(
            (enemy) =>
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y
          );

          if (hitEnemy) {
            gameStateRef.current.enemies = gameStateRef.current.enemies.filter(
              (e) => e !== hitEnemy
            );
            gameStateRef.current.score += 100;
            return false;
          }

          return bullet.y > 0;
        }
      );

      // 점수 표시
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${gameStateRef.current.score}`, 10, 30);
      ctx.fillText(`Lives: ${gameStateRef.current.lives}`, 10, 60);

      if (gameStateRef.current.gameOver) {
        ctx.fillStyle = "blue";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#16274a] m-0 p-0">
      <div className="text-white mb-4">
        좌클릭: 왼쪽으로 이동 | 우클릭: 오른쪽으로 이동
      </div>
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="border border-gray-600"
      />
    </div>
  );
};

export default ShootingGame;
