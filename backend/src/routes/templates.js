const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { category, industry, isActive } = req.query;
    const where = {};
    if (category) where.category = category;
    if (industry) where.industry = industry;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const template = await prisma.template.create({
      data: req.body
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const template = await prisma.template.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    await prisma.template.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clone template to create contract
router.post('/:id/clone', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const contract = await prisma.contract.create({
      data: {
        title: req.body.title || `${template.name} - Copy`,
        description: template.description,
        content: template.content,
        contractType: template.category,
        templateId: template.id,
        status: 'draft'
      }
    });

    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
