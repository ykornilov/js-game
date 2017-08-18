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

		if (actor.right < actor.left || actor.bottom < actor.top) {
			return false;
		}

		if (((actor.left >= this.left && actor.left < this.right) && (actor.top >= this.top && actor.top < this.bottom)) ||
			((actor.right > this.left && actor.right <= this.right) && (actor.top >= this.top && actor.top < this.bottom)) ||
			((actor.left >= this.left && actor.left < this.right) && (actor.bottom > this.top && actor.bottom <= this.bottom)) ||
			((actor.right > this.left && actor.right <= this.right) && (actor.bottom > this.top && actor.bottom <= this.bottom))) {
			return true;
		}
		return false;
	}
}

class Level {
	constructor(grid = [], actors = []) {
		this.grid = grid;
		this.actors = actors;
		this.status = null;
		this.finishDelay = 1;
		this.player = this.actors.find(item => item.type === 'player');
		if (this.player === undefined) {
			this.player = new Player();
		} 
	}

	get height() {
		return this.grid.length;
	}

	get width() {
		return this.grid.reduce((max, line) => Math.max(max, line.length), 0);
	}

	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(actor) {
		if (!(actor instanceof Actor)) {
			throw new Error('В метод actorAt должен быть передан объект типа Actor');
		}

		return this.actors.find(item => item.isIntersect(actor) && (item !== actor));
	}

	obstacleAt(pos, size) {
		if (!(pos instanceof Vector) || !(size instanceof Vector)) {
			throw new Error('В метод obstacleAt должны передаваться аргументы типа Vector');
		}

		if (pos.y < 0 || pos.x < 0 || (pos.x + size.x) >= this.width) {
			return 'wall';
		} else if (pos.y + size.y >= this.height) {
			return 'lava';
		}

		for (let y = Math.floor(pos.y); y < Math.ceil(pos.y + size.y); y++) {
			for (let x = Math.floor(pos.x); x < Math.ceil(pos.x + size.x); x++) {
				if (this.grid[y][x] === 'wall') {
					return 'wall';
				} else if (this.grid[y][x] === 'lava') {
					return 'lava';
				}
			}
		}
	}

	removeActor(actor) {
		let index = this.actors.indexOf(actor);
		if (index !== -1) {
			this.actors.splice(index, 1);
		}
	}

	noMoreActors(type) {
		return !this.actors.find(item => item.type === type);
	}

	playerTouched(obstacle, actor) {
		if (this.status) {
			return;
		}

		if (obstacle === 'lava' || obstacle === 'fireball') {
			this.status = 'lost';
			return;
		}

		if (obstacle === 'coin' && actor && actor.type === 'coin') {
			this.removeActor(actor);
			if (this.actors.find(item => item.type === 'coin') === undefined) {
				this.status = 'won';
				return;
			}
		}
	}
}

class LevelParser {
	constructor(actorDict = {}) {
		this.actorDict = actorDict;
	}

	actorFromSymbol(symbol) {
		if (symbol === undefined || !(symbol in this.actorDict)) {
			return;
		}
		return this.actorDict[symbol];
	}

	obstacleFromSymbol(symbol) {
		switch(symbol) {
			case 'x':
				return 'wall';
			case '!':
				return 'lava';
			default:
				return;
		}
	}

	createGrid(plan = []) {
		if (Array.isArray(plan) && plan.length === 0) {
			return [];
		}

		return plan.map(row => row.split('').map(symbol => this.obstacleFromSymbol(symbol)));
	}

	createActors(plan) {
		if (Array.isArray(plan) && plan.length === 0) {
			return [];
		}

		return plan.reduce((actors, row, y) => {
            row.split('')
                .forEach((symbol, x) => {
                    const TypeOfObj = this.actorFromSymbol(symbol);
                    if (TypeOfObj && typeof TypeOfObj === 'function' && Actor.prototype.isPrototypeOf(new TypeOfObj())) {
                        actors.push(new TypeOfObj(new Vector(x, y)));
                    }
                });
            return actors;
        }, []);
	}

	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}
}

class Player extends Actor {
	constructor(pos = new Vector()) {
		super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
	}

	get type() {
		return 'player';
	}
}

class Coin extends Actor {
	constructor(pos = new Vector()) {
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6), new Vector(0, 0));

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
		return this.pos.plus(this.getSpringVector());
	}

	act(time) {
		this.pos = this.getNextPosition(time);
	}	
}

class Fireball extends Actor {
	constructor(pos = new Vector(), speed = new Vector()) {
		super(pos, new Vector(1, 1), speed);
	}

	get type() {
		return 'fireball';
	}

	getNextPosition(time = 1) {
		return this.pos.plus(this.speed.times(time));
	}

	handleObstacle() {
		this.speed.x *= -1;
		this.speed.y *= -1; 
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
	constructor(pos = new Vector()) {
		super(pos, new Vector(2, 0));
	}
}

class VerticalFireball extends Fireball {
	constructor(pos = new Vector()) {
		super(pos, new Vector(0, 2));
	}
}

class FireRain extends Fireball {
	constructor(pos = new Vector()) {
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
}
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