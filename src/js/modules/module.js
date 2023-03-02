export default class Module {
    constructor({name, init}){
        this.name = name;
        this.initFunc = init;
    }

    async init(args){
        //run pre-init func
        await this.preInit();
        const result = await this.initFunc(args);
        return result;
    }

    async preInit(){
        console.log("Loading module: " + this.name);
        return true;
    }

}
