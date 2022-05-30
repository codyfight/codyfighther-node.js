import axios from 'axios';

const CKEY = '***';
const GAME_MODE = 2;
const API_URL = 'https://game.codyfight.com';

const GAME_STATUS_ENDED = 2;
const GAME_STATUS_PLAYING = 1;
const GAME_STATUS_INITIALIZING = 0;

export default class CBot {

    constructor(app) {
        this.app = app;
        this.game = {};
    }

    run = async () => {
        try {
            await this.play();
        } catch (e) {
            console.error(`Runtime error! retrying...`, e);
            this.run();
        }

        console.log('rematching...');
        this.run();
    };

    play = async () => {
        // initialize a new game
        this.game = await this.init(CKEY, GAME_MODE, null);

        console.log(this.game);

        // wait an opponent match
        while (this.game.state.status === GAME_STATUS_INITIALIZING) {
            this.game = await check(CKEY);
        }

        // play the game
        while (this.game.state.status === GAME_STATUS_PLAYING) {
            if (this.game.operators.bearer.is_action_required) {
                // TODO: implement smart solution here instead of random movement
                let randomMove = Math.floor(Math.random() * this.game.operators.bearer.possible_moves.length);
                let x = this.game.operators.bearer.possible_moves[randomMove].x;
                let y = this.game.operators.bearer.possible_moves[randomMove].y;

                this.game = await move(CKEY, x, y);
            } else {
                this.game = await check(CKEY);
            }
        }

        // game ended
        if (this.game.state.status === GAME_STATUS_ENDED) {
            console.log('Game finished!', this.game.verdict);
        }
    };

    init = async (CKey, mode, opponent) => {
        return await this.request('POST', { 'ckey': CKey, 'mode': mode, 'opponent': opponent });
    }
    
    move = async (CKey, x, y) => {
        return await this.request('PUT', { 'ckey': CKey, 'x': x, 'y': y });
    }
    
    check = async (CKey) => {
        return await this.request('GET', { 'ckey': CKey });
    }
    
    request = async (method, params) => {
        let config = {
            url: API_URL + '?ckey=' + params.ckey,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
    
        if (!(method === 'GET' || method === 'HEAD')) {
            // config.data = JSON.stringify(params);
            config.data = params;
        }
    
        let response = await axios(config);

        if (response.status !== 200) {
            throw response;
        }

        return response;
    }
};