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

