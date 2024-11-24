// components/BrickBreaker.tsx
import React, { useEffect, useRef } from "react";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  color?: string;
  visible?: boolean;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  speed: number;
}

interface GameState {
  paddle: GameObject;
  ball: Ball;
  bricks: GameObject[];
  score: number;
  lives: number;
  gameOver: boolean;
}

const BRICK_ROWS = 5;
const BRICK_COLS = 9;
const BRICK_PADDING = 10;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 20;
const BALL_RADIUS = 8;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;

const BrickBreaker: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 벽돌 초기화 함수
  const initializeBricks = () => {
    const bricks: GameObject[] = [];
    const brickColors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF"];

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 30,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          color: brickColors[row],
        });
      }
    }
    return bricks;
  };

  const gameStateRef = useRef<GameState>({
    paddle: {
      x: 350,
      y: 550,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 7,
    },
    ball: {
      x: 400,
      y: 540,
      radius: BALL_RADIUS,
      dx: 4,
      dy: -4,
      speed: 4,
    },
    bricks: initializeBricks(),
    score: 0,
    lives: 3,
    gameOver: false,
  });

  // 마우스 이동 처리
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const paddle = gameStateRef.current.paddle;

      if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = Math.min(
          Math.max(relativeX - paddle.width / 2, 0),
          canvas.width - paddle.width
        );
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 충돌 감지 함수
  const detectCollision = (ball: Ball, rect: GameObject) => {
    return (
      ball.x + ball.radius > rect.x &&
      ball.x - ball.radius < rect.x + rect.width &&
      ball.y + ball.radius > rect.y &&
      ball.y - ball.radius < rect.y + rect.height
    );
  };

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const resetBall = () => {
      const { ball, paddle } = gameStateRef.current;
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
      ball.dx = ball.speed;
      ball.dy = -ball.speed;
    };

    const gameLoop = () => {
      const { paddle, ball, bricks } = gameStateRef.current;

      if (gameStateRef.current.gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "48px Arial";
        ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
        return;
      }

      // 화면 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 벽돌 그리기
      bricks.forEach((brick) => {
        if (brick.visible) {
          ctx.fillStyle = brick.color || "#FF0000";
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      });

      // 패들 그리기
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

      // 공 그리기
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.closePath();

      // 점수 표시
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${gameStateRef.current.score}`, 10, 20);
      ctx.fillText(
        `Lives: ${gameStateRef.current.lives}`,
        canvas.width - 100,
        20
      );

      // 공 이동
      ball.x += ball.dx;
      ball.y += ball.dy;

      // 벽 충돌 감지
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      }

      // 바닥 충돌 (생명 감소)
      if (ball.y + ball.radius > canvas.height) {
        gameStateRef.current.lives--;
        if (gameStateRef.current.lives <= 0) {
          gameStateRef.current.gameOver = true;
        } else {
          resetBall();
        }
      }

      // 패들 충돌 감지
      if (detectCollision(ball, paddle)) {
        const hitPoint =
          (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dx = hitPoint * 5; // 충돌 위치에 따라 방향 변경
        ball.dy = -ball.dy;
      }

      // 벽돌 충돌 감지
      bricks.forEach((brick) => {
        if (brick.visible && detectCollision(ball, brick)) {
          brick.visible = false;
          ball.dy = -ball.dy;
          gameStateRef.current.score += 10;

          // 승리 조건 체크
          if (bricks.every((b) => !b.visible)) {
            alert("Congratulations! You won!");
            gameStateRef.current.gameOver = true;
          }
        }
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen mt-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="lg:w-[800px] w-full "
      />
    </div>
  );
};

export default BrickBreaker;
