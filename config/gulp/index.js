import registerBuild from './tasks/build';
import registerClean from './tasks/clean';
import registerLint from './tasks/lint';
import registerSpec from './tasks/spec';
import registerTest from './tasks/test';
import registerDefault from './tasks/default';

registerClean();
registerLint();
registerSpec();
registerTest();
registerBuild();

registerDefault();
