'use strict';
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient();
async function main() {
  const email=String(process.env.PROVISION_EMAIL||process.env.PROVISION_ADMIN_EMAIL||process.env.ADMIN_EMAIL||'').trim().toLowerCase(); const password=String(process.env.PROVISION_PASSWORD||process.env.PROVISION_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD||'');
  const tenantId=String(process.env.PROVISION_TENANT_ID||process.env.GOVERNANCE_TENANT_ID||process.env.TENANT_ID||'').trim(); const name=String(process.env.PROVISION_NAME||'Runtime Administrator').trim();
  const role=String(process.env.PROVISION_ROLE||'admin').trim(); const allowed=['admin','negotiator','legal_approver','business_approver'];
  if(!email||!tenantId||!name||password.length<14||!allowed.includes(role)) throw new Error('PROVISION_EMAIL, PROVISION_NAME, PROVISION_TENANT_ID, PROVISION_PASSWORD (14+), and an allowed PROVISION_ROLE are required');
  await prisma.user.upsert({where:{email},create:{email,name,tenantId,role,password:await bcrypt.hash(password,12)},update:{name,tenantId,role,password:await bcrypt.hash(password,12)}});
  console.log(`Provisioned ${role} for tenant ${tenantId}`);
}
main().catch((e)=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
