window.addEventListener("load", function () {
  /**@type{HTMLCanvasElement} */
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 500;
  canvas.height = 500;

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;

  class Particle {
    constructor(effect) {
      this.effect = effect;
      this.x = Math.random() * this.effect.width;
      this.y = Math.random() * this.effect.height;
      this.size = 10;
      this.speedX;
      this.speedY;
      this.speedModifier = Math.floor(Math.random() * 2 + 1);

      this.history = [{ x: this.x, y: this.y }];
      this.maxLength = Math.floor(Math.random() * 60 + 20);
      this.angle = 0;
      this.newAngle = 0;
      this.angleCorrector = Math.random() * 0.5 + 0.01;
      this.timer = this.maxLength * 2;
      this.colorArray = [
        "rgb(252, 3, 244)",
        "rgb(198, 3, 252)",
        "rgb(107, 3, 252)",
        "rgb(3, 3, 252)",
        'white'
      ];

      this.color =
        this.colorArray[Math.floor(Math.random() * this.colorArray.length)];
    }
    draw() {
      //ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 0; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.stroke();
    }
    update() {
      this.timer--;
      if (this.timer >= 1) {
        let x = Math.floor(this.x / this.effect.cellSize);
        let y = Math.floor(this.y / this.effect.cellSize);
        let index = y * this.effect.cols + x;

        if (this.effect.flowField[index]) {
          this.newAngle = this.effect.flowField[index].colorAngle;
          if (this.angle > this.newAngle) {
            this.angle -= this.angleCorrector;
          } else if (this.angle < this.newAngle) {
            this.angle += this.angleCorrector;
          }
        }

        this.speedX = Math.cos(this.angle);
        this.speedY = Math.sin(this.angle);
        this.x += this.speedX * this.speedModifier;
        this.y += this.speedY * this.speedModifier;

        this.history.push({ x: this.x, y: this.y });

        if (this.history.length > this.maxLength) {
          this.history.shift(1);
        }
      } else if (this.history.length > 1) {
        this.history.shift();
      } else {
        this.reset();
      }
    }
    reset() {
      let attempts = 0;
      let resetSuccess = false;

      while (attempts < 10 && !resetSuccess) {
        attempts++;
        let testIndex = Math.floor(
          Math.random() * this.effect.flowField.length
        );
        if (this.effect.flowField[testIndex].alpha > 0) {
          this.x = this.effect.flowField[testIndex].x;
          this.y = this.effect.flowField[testIndex].y;
          this.history = [{ x: this.x, y: this.y }];
          this.timer = this.maxLength * 2;
          resetSuccess = true;
        }
      }
      if (!resetSuccess) {
        this.x = Math.random() * this.effect.width;
        this.y = Math.random() * this.effect.height;
        this.history = [{ x: this.x, y: this.y }];
        this.timer = this.maxLength * 2;
      }
    }
  }

  class Effect {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.context = ctx;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.particles = [];
      this.numOfParticles = 2000;
      this.cellSize = 5;
      this.rows;
      this.cols;
      this.flowField = [];
      this.debug = false;
      this.init();
      const zoomSlider = document.getElementById("zoom");
      const zoomLabel = document.getElementById("zoomLabel");
      const curveSlider = document.getElementById("curve");
      const curveLabel = document.getElementById("curveLabel");

      zoomSlider.addEventListener("change", (e) => {
        this.zoom = Number(e.target.value);
        zoomLabel.innerText = `Zoom   ${this.zoom}`;
        this.init();
      });
      curveSlider.addEventListener("change", (e) => {
        this.curve = Number(e.target.value);
        curveLabel.innerText = `Curve    ${this.curve}`;
        this.init();
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "d") {
          this.debug = !this.debug;
        }

        window.addEventListener("resize", (e) => {
          //this.resize(e.target.innerWidth, e.target.innerHeight);
        });
      });
    }
    drawText() {
      this.context.font = "420px Impact";
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";
      const grad1 = this.context.createLinearGradient(
        0,
        0,
        this.width,
        this.height
      );
      grad1.addColorStop(0.2, "rgb(255,0,0");
      grad1.addColorStop(0.4, "rgb(0,255,0");
      grad1.addColorStop(0.6, "rgb(150,100,100");
      grad1.addColorStop(0.8, "rgb(0, 255 ,255");

      const grad2 = this.context.createLinearGradient(
        0,
        0,
        this.width,
        this.height
      );
      grad2.addColorStop(0.2, "rgb(255,255,0");
      grad2.addColorStop(0.4, "rgb(200,5, 50");
      grad2.addColorStop(0.6, "rgb(150,255,255");
      grad2.addColorStop(0.8, "rgb(255, 255 ,150");

      const grad3 = this.context.createRadialGradient(
        this.width * 0.5,
        this.height * 0.5,
        10,
        this.width * 0.5,
        this.height * 0.5,
        this.width
      );
      grad3.addColorStop(0.2, "rgb(0,0 ,255");
      grad3.addColorStop(0.4, "rgb(200,255, 0");
      grad3.addColorStop(0.6, "rgb(0, 0,255");
      grad3.addColorStop(0.8, "rgb(0, 255 ,150");

      this.context.fillStyle = grad3;
      this.context.fillText(
        "JS",
        this.width * 0.5,
        this.height * 0.5,
        this.width * 0.8
      );
    }
    init() {
      //create flow field
      this.rows = Math.floor(this.height / this.cellSize);
      this.cols = Math.floor(this.width / this.cellSize);
      this.flowField = [];
      // draw text
      this.drawText();

      //scan Pixel Data
      const pixels = this.context.getImageData(
        0,
        0,
        this.width,
        this.height
      ).data;
      for (let y = 0; y < this.height; y += this.cellSize) {
        for (let x = 0; x < this.width; x += this.cellSize) {
          const index = (y * this.width + x) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          const grayScale = (red + green + blue) / 3;
          const colorAngle = ((grayScale / 255) * 6.28).toFixed(2);
          this.flowField.push({
            x: x,
            y: y,
            alpha: alpha,
            colorAngle: colorAngle,
          });
        }
      }

      // for (let y = 0; y < this.rows; y++) {
      //   for (let x = 0; x < this.cols; x++) {
      //     let angle =
      //       (Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * this.curve;
      //     this.flowField.push(angle);
      //   }
      // }

      // create particles
      this.particles = [];
      for (let i = 0; i < this.numOfParticles; i++) {
        this.particles.push(new Particle(this));
      }
    }
    drawGrid() {
      this.context.save();
      this.context.strokeStyle = "white";
      this.context.lineWidth = 0.75;
      for (let c = 0; c < this.cols; c++) {
        this.context.beginPath();
        this.context.moveTo(this.cellSize * c, 0);
        this.context.lineTo(this.cellSize * c, this.height);
        this.context.stroke();
      }
      for (let r = 0; r < this.rows; r++) {
        this.context.beginPath();
        this.context.moveTo(0, this.cellSize * r);
        this.context.lineTo(this.width, this.cellSize * r);
        this.context.stroke();
      }
      this.context.restore();
    }
    resize(width, height) {
      this.canvas = canvas;
      this.width = width;
      this.height = height;
      this.init();
    }
    render() {
      if (this.debug) {
        this.drawGrid();
        this.drawText();
      }

      this.particles.forEach((particle) => {
        particle.draw(this.context);
        particle.update();
      });
    }
  }
  const effect = new Effect(canvas, ctx);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    effect.render();
    requestAnimationFrame(animate);
  }
  animate();

  //load function end
});
