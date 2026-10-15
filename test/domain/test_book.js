import matrix from '../e2e/matrix.js';
import memory from '../e2e/kits/memory.js';
import contracts from '../e2e/contracts.js';

matrix([memory()], contracts());
