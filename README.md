PocketBase Angular SDK
======================================================================

PocketBase Angular SDK for interacting with the [PocketBase API](https://pocketbase.io/docs). Based on the [PocketBase JavaScript SDK](https://github.com/pocketbase/js-sdk)

- [Installation](#installation)
- [Usage](#usage)


## Installation

### Node.js (via npm)

```sh
npm install ngx-pocketbase --save
```


## Usage

Add the PocketBase module to your `app.module.ts`:

```typescript
import {PocketBaseModule} from 'ngx-pocketbase';

@NgModule({
    ...
    imports: [
        PocketBaseModule.init({ baseUrl: 'http://127.0.0.1:8090' }),
    ],
    ...
})
export class AppModule {
}
```

Then, import the PocketBase service and inject it into a constructor:

```typescript
import { PocketBaseService } from 'ngx-pocketbase';

...

constructor(
    private pb: PocketBaseService
) {
    // list and filter "example" collection records
    const result = await pb.collection('example').getList(1, 20, {
        filter: 'status = true && created > "2022-08-01 10:00:00"'
    });

    // authenticate as auth collection record
    const userData = await pb.collection('users').authWithPassword('test@example.com', '123456');

    // or as super-admin
    const adminData = await pb.admins.authWithPassword('test@example.com', '123456');

    // and much more...
}
```

> More detailed API docs and copy-paste examples could be found in the [API documentation for each service](https://pocketbase.io/docs/api-records/).