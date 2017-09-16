'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(vector) {
		if (!(vector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector');
		}

		return new Vector(this.x + vector.x, this.y + vector.y);
	}

	times(num) {
		return new Vector(this.x * num, this.y * num);
	}
}

class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
		if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
			throw new Error('В качестве параметров объекта Actor могут использоваться только объекты Vector');
		}

		this.pos = pos;
		this.size = size;
		this.speed = speed;

	}

	get type() {
		return 'actor';
	}

	get left() {
		return this.pos.x;
	}

	get right() {
		return this.pos.x + this.size.x;
	}

	get top() {
		return this.pos.y;
	}

	get bottom() {
		return this.pos.y + this.size.y;
	}

	act() {
	}

	isIntersect(actor) {
		if (!(actor instanceof Actor)) {
			throw new Error('Не передан аргумент для метода isIntersect или аргумент не является объектом типа Actor');
		}

		if (actor === this) {
			return false;
		}

		return actor.left < this.right && actor.right > this.left && actor.top < this.bottom && actor.bottom > this.top
	}
}

class Level {
	constructor(grid = [], actors = []) {
		this.grid = grid.slice();
		this.actors = actors.slice();
		this.status = null;
		this.finishDelay = 1;
		this.player = this.actors.find(item => item.type === 'player');
		this.height = this.grid.length;
		this.width = Math.max(0, ...this.grid.map(line => line.length));
	}

	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(actor) {
		if (!(actor instanceof Actor)) {
			throw new Error('В метод actorAt должен быть передан объект типа Actor');
		}

		return this.actors.find(item => item.isIntersect(actor));
	}

	obstacleAt(pos, size) {
		if (!(pos instanceof Vector) || !(size instanceof Vector)) {
			throw new Error('В метод obstacleAt должны передаваться аргументы типа Vector');
		}
		const yTop = pos.y;
		const yBottom = pos.y + size.y;
		const xLeft = pos.x;
		const xRight = pos.x + size.x;
		const yTopFloor = Math.floor(yTop);
		const yBottomCeil = Math.ceil(yBottom);
		const xLeftFloor = Math.floor(xLeft);
		const xRightCeil = Math.ceil(xRight);

		if (yTop < 0 || xLeft < 0 || xRight >= this.width) {
			return 'wall';
		}

		if (yBottom >= this.height) {
			return 'lava';
		}

		for (let y = yTopFloor; y < yBottomCeil; y++) {
			for (let x = xLeftFloor; x < xRightCeil; x++) {
				if (this.grid[y][x] !== undefined) {
					return this.grid[y][x];
				}
			}
		}
	}

	removeActor(actor) {
		const index = this.actors.indexOf(actor);
		if (index !== -1) {
			this.actors.splice(index, 1);
		}
	}

	noMoreActors(type) {
		return !this.actors.some(item => item.type === type);
	}

	playerTouched(obstacle, actor) {
		if (this.status) {
			return;
		}

		if (obstacle === 'lava' || obstacle === 'fireball') {
			this.status = 'lost';
			return;
		}

		if (obstacle === 'coin' && actor.type === 'coin') {
			this.removeActor(actor);
			if (this.noMoreActors('coin')) {
				this.status = 'won';
			}
		}
	}
}

class LevelParser {
	constructor(actorDict = {}) {
		this.actorDict = Object.assign({}, actorDict);
	}

	actorFromSymbol(symbol) {
		return this.actorDict[symbol];
	}

	obstacleFromSymbol(symbol) {
		switch(symbol) {
			case 'x':
				return 'wall';
			case '!':
				return 'lava';
		}
	}

	createGrid(plan = []) {
		return plan.map(row => row.split('').map(symbol => this.obstacleFromSymbol(symbol)));
	}

	createActors(plan) {
		const actors = [];
		for(let y = 0; y < plan.length; y++) {
			for(let x = 0; x < plan[y].length; x++) {
				const TypeOfObj = this.actorFromSymbol(plan[y][x]);
	            if (typeof TypeOfObj === 'function') {
	            	const actor = new TypeOfObj(new Vector(x, y));
	            	if (actor instanceof Actor) {
	            		actors.push(actor);
	            	}
	            }
			}
		}
		return actors;
	}

	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}
}

class Player extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
	}

	get type() {
		return 'player';
	}
}

class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6), new Vector(0, 0));

		this.startPos = this.pos;
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
	}

	get type() {
		return 'coin';
	}

	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}

	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}

	getNextPosition(time = 1) {
		this.updateSpring(time);
		return this.startPos.plus(this.getSpringVector());
	}

	act(time, level) {
		this.pos = this.getNextPosition(time);
	}	
}

class Fireball extends Actor {
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, new Vector(1, 1), speed);
	}

	get type() {
		return 'fireball';
	}

	getNextPosition(time = 1) {
		return this.pos.plus(this.speed.times(time));
	}

	handleObstacle() {
		this.speed = this.speed.times(-1); 
	}

	act(time, level) {
		const nextPos = this.getNextPosition(time);
		if (level.obstacleAt(nextPos, this.size)) {
			this.handleObstacle();
		} else {
			this.pos = nextPos;
		}
	}
}

class HorizontalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(2, 0));
	}
}

class VerticalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0, 2));
	}
}

class FireRain extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0, 3));
		this.startPos = pos;
	}

	handleObstacle() {
		this.pos = this.startPos;
	}
}


const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
}; 
const parser = new LevelParser(actorDict);

loadLevels()
  .then(JSON.parse)
  .then(schemas => runGame(schemas, parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'))
  .catch(err => {
  	switch(err.name) {
		case 'Error':
			alert('Ошибка при чтении файла со схемами уровней');
			break;
		case 'SyntaxError':
			alert('Ошибка при разборе файла со схемой уровней');
			break;
		default:
			alert(err);
	}
});