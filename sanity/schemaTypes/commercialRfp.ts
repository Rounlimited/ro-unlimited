import { defineField, defineType } from 'sanity';

/**
 * Commercial RFP submissions from /contact.
 * If your Studio lives elsewhere, import this module into your main schema `types` array.
 */
export default defineType({
  name: 'commercialRfp',
  title: 'Commercial RFP',
  type: 'document',
  fields: [
    defineField({
      name: 'organizationName',
      title: 'Organization',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contactName',
      title: 'Contact name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'projectType',
      title: 'Project type',
      type: 'string',
      options: {
        list: [
          { title: 'QSR / Restaurant', value: 'qsr' },
          { title: 'Retail', value: 'retail' },
          { title: 'Bank / Financial', value: 'bank' },
          { title: 'Industrial', value: 'industrial' },
          { title: 'Strip mall', value: 'strip_mall' },
          { title: 'Office', value: 'office' },
          { title: 'Other commercial', value: 'other_commercial' },
          { title: 'Residential', value: 'residential' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'scope',
      title: 'Scope',
      type: 'string',
      options: {
        list: [
          { title: 'New construction', value: 'new_construction' },
          { title: 'Renovation', value: 'renovation' },
          { title: 'Tenant buildout', value: 'tenant_buildout' },
          { title: 'Site work only', value: 'site_work' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'squareFootage', title: 'Est. square footage', type: 'string' }),
    defineField({ name: 'locationCityState', title: 'Location (city, state)', type: 'string' }),
    defineField({ name: 'desiredStartDate', title: 'Desired start', type: 'string' }),
    defineField({
      name: 'budgetRange',
      title: 'Budget range',
      type: 'string',
      options: {
        list: [
          { title: 'Prefer not to say', value: '' },
          { title: 'Under $500k', value: 'under_500k' },
          { title: '$500k – $1M', value: '500k_1m' },
          { title: '$1M – $5M', value: '1m_5m' },
          { title: '$5M+', value: '5m_plus' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({ name: 'description', title: 'Project description', type: 'text', rows: 6 }),
    defineField({
      name: 'referralSource',
      title: 'How they heard about us',
      type: 'string',
      options: {
        list: [
          { title: '—', value: '' },
          { title: 'Referral', value: 'referral' },
          { title: 'Google / search', value: 'google' },
          { title: 'Social media', value: 'social' },
          { title: 'Saw our work / jobsite', value: 'jobsite' },
          { title: 'Franchisor / brand list', value: 'franchise' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'new',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'In review', value: 'in_review' },
          { title: 'Contacted', value: 'contacted' },
          { title: 'Closed', value: 'closed' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'notes', title: 'Internal notes', type: 'text', rows: 4 }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'submittedFromHost',
      title: 'Host (e.g. site2.rounlimited.com)',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      org: 'organizationName',
      contact: 'contactName',
      pt: 'projectType',
      submittedAt: 'submittedAt',
    },
    prepare({ org, contact, pt, submittedAt }) {
      return {
        title: org || 'Commercial RFP',
        subtitle: [contact, pt, submittedAt].filter(Boolean).join(' · '),
      };
    },
  },
  orderings: [
    {
      title: 'Submitted, newest',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
});
