import { getAllRawMaterials } from './src/controllers/rawMaterial.controller.js';

const req = {
  query: { companyId: '39eeefea-8f69-4d55-8f97-e10f130ca68d' }
};

const res = {
  status: (code) => ({
    json: (data) => console.log('STATUS:', code, 'DATA:', data)
  }),
  json: (data) => console.log('SUCCESS JSON:', data)
};

getAllRawMaterials(req, res).then(() => {
  console.log('done');
  process.exit(0);
});
