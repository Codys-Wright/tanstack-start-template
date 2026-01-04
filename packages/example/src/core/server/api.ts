import { FeatureApiGroup } from '@example/features/feature';
import * as HttpApi from '@effect/platform/HttpApi';

export class ExampleApi extends HttpApi.make('example-api').add(FeatureApiGroup) {}
