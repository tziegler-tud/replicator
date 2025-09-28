import db from '../../schemes/mongo.js';
const DbWebhook = db.Webhook;

export default class Webhook {

    static fromDb(dbWebhook){
        return new Webhook({
            identifier: dbWebhook.identifier,
            name: dbWebhook.name,
            slug: dbWebhook.slug,
            properties: dbWebhook.properties,
            variables: dbWebhook.variables,
            actions: dbWebhook.actions,
            finisher: dbWebhook.finisher});
    }

    constructor({identifier, name, slug, properties, variables, actions, finisher}) {
        this.identifier = identifier;
        this.name = name;
        this.slug = slug;
        this.properties = properties;
        this.variables = variables;
        this.actions = actions;
        this.finisher = finisher;
    }

    async save(){
        const dbObject = await DbWebhook.findOne({identifier: this.identifier}).exec();
        if(dbObject) {
            dbObject.identifier = this.identifier;
            dbObject.name = this.name;
            dbObject.slug = this.slug;
            dbObject.properties = this.properties;
            dbObject.variants = this.variables;
            dbObject.actions = this.actions;
            dbObject.finisher = this.finisher;

            dbObject.markModified("actions");
            dbObject.markModified("properties");
            dbObject.markModified("settings");
            await dbObject.save();
            return this;
        }
        else {
            const dbObject = new DbWebhook({
                identifier: this.identifier,
                name: this.name,
                slug: this.slug,
                properties: this.properties,
                variables: this.variables,
                actions: this.actions,
                finisher: this.finisher
            })
            await dbObject.save();
            return this;
        }
    }

    async update(data){
        const updateAbleSettings = {
            name: data.name,
            slug: data.slug,
            properties: data.properties,
            variables: data.variables,
            actions: data.actions,
            finisher: data.finisher
        }

        const updated = Object.assign(this, updateAbleSettings);
        Object.keys(updateAbleSettings).forEach(key => {
            this[key] = updated[key];
        })
        await this.save()
        return this;
    }

    async remove(){
        const dbObject = await DbWebhook.findOne({identifier: this.identifier}).exec();
        if(dbObject) {
            return DbWebhook.findByIdAndRemove(dbObject.id);
        }
        else return false;
    }
}