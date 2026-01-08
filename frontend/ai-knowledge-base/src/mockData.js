// Mock Data for Demo Version
// This allows the app to work without a backend for demonstration purposes

export const MOCK_DOCUMENTS = [
  {
    id: 'demo-1',
    file_name: 'Machine_Learning_Introduction.pdf',
    upload_date: '2024-01-15',
    file_size: 245600
  },
  {
    id: 'demo-2',
    file_name: 'Cloud_Computing_Guide.txt',
    upload_date: '2024-01-16',
    file_size: 128400
  },
  {
    id: 'demo-3',
    file_name: 'Data_Science_Best_Practices.pdf',
    upload_date: '2024-01-17',
    file_size: 512300
  }
];

export const MOCK_SEARCH_RESULTS = {
  'machine learning': [
    {
      document_id: 'demo-1',
      file_name: 'Machine_Learning_Introduction.pdf',
      text: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.',
      similarity: 0.92
    },
    {
      document_id: 'demo-3',
      file_name: 'Data_Science_Best_Practices.pdf',
      text: 'In data science, machine learning models are trained on historical data to make predictions about future outcomes. Common algorithms include decision trees, random forests, and neural networks.',
      similarity: 0.85
    }
  ],
  'cloud': [
    {
      document_id: 'demo-2',
      file_name: 'Cloud_Computing_Guide.txt',
      text: 'Cloud computing delivers computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet to offer faster innovation and flexible resources.',
      similarity: 0.89
    },
    {
      document_id: 'demo-3',
      file_name: 'Data_Science_Best_Practices.pdf',
      text: 'Cloud platforms like AWS, Azure, and GCP provide scalable infrastructure for training large machine learning models. Services like AWS SageMaker simplify the ML workflow.',
      similarity: 0.78
    }
  ],
  'data science': [
    {
      document_id: 'demo-3',
      file_name: 'Data_Science_Best_Practices.pdf',
      text: 'Data science combines statistics, mathematics, and computer science to extract insights from structured and unstructured data. It involves data collection, cleaning, analysis, and visualization.',
      similarity: 0.94
    },
    {
      document_id: 'demo-1',
      file_name: 'Machine_Learning_Introduction.pdf',
      text: 'Data science and machine learning are closely related fields. While data science focuses on extracting insights from data, machine learning automates analytical model building.',
      similarity: 0.81
    }
  ],
  'default': [
    {
      document_id: 'demo-1',
      file_name: 'Machine_Learning_Introduction.pdf',
      text: 'This document provides a comprehensive introduction to machine learning concepts, algorithms, and practical applications in various industries.',
      similarity: 0.72
    },
    {
      document_id: 'demo-2',
      file_name: 'Cloud_Computing_Guide.txt',
      text: 'A complete guide to cloud computing covering IaaS, PaaS, SaaS, deployment models, and major cloud service providers.',
      similarity: 0.68
    },
    {
      document_id: 'demo-3',
      file_name: 'Data_Science_Best_Practices.pdf',
      text: 'Best practices for data science projects including data preparation, model selection, evaluation metrics, and deployment strategies.',
      similarity: 0.65
    }
  ]
};

export const MOCK_QA_RESPONSES = {
  'what is machine learning': {
    answer: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.',
    sources: [
      {
        file_name: 'Machine_Learning_Introduction.pdf',
        text: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.'
      },
      {
        file_name: 'Data_Science_Best_Practices.pdf',
        text: 'In data science, machine learning models are trained on historical data to make predictions about future outcomes.'
      }
    ]
  },
  'cloud computing': {
    answer: 'Cloud computing delivers computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet. It offers faster innovation, flexible resources, and economies of scale. Major providers include AWS, Azure, and Google Cloud Platform (GCP), each offering IaaS, PaaS, and SaaS solutions.',
    sources: [
      {
        file_name: 'Cloud_Computing_Guide.txt',
        text: 'Cloud computing delivers computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet to offer faster innovation and flexible resources.'
      },
      {
        file_name: 'Data_Science_Best_Practices.pdf',
        text: 'Cloud platforms like AWS, Azure, and GCP provide scalable infrastructure for training large machine learning models.'
      }
    ]
  },
  'default': {
    answer: 'Based on the available documents, this knowledge base contains information about machine learning, cloud computing, and data science best practices. You can ask questions about these topics to get detailed answers with sources.',
    sources: [
      {
        file_name: 'Machine_Learning_Introduction.pdf',
        text: 'This document provides a comprehensive introduction to machine learning concepts and applications.'
      }
    ]
  }
};

// Helper function to get search results
export const getMockSearchResults = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Check for exact matches
  for (const [key, results] of Object.entries(MOCK_SEARCH_RESULTS)) {
    if (lowerQuery.includes(key)) {
      return results;
    }
  }
  
  // Return default results
  return MOCK_SEARCH_RESULTS.default;
};

// Helper function to get Q&A response
export const getMockQAResponse = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // Check for specific questions
  if (lowerQuestion.includes('machine learning') || lowerQuestion.includes('ml')) {
    return MOCK_QA_RESPONSES['what is machine learning'];
  }
  
  if (lowerQuestion.includes('cloud')) {
    return MOCK_QA_RESPONSES['cloud computing'];
  }
  
  // Return default response
  return MOCK_QA_RESPONSES.default;
};

// Mock file content for download
export const MOCK_FILE_CONTENT = {
  'demo-1': `Machine Learning Introduction
=============================

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

Key Concepts:
- Supervised Learning: Training with labeled data
- Unsupervised Learning: Finding patterns in unlabeled data
- Reinforcement Learning: Learning through trial and error

Common Algorithms:
- Linear Regression
- Decision Trees
- Random Forests
- Neural Networks

Applications:
- Image Recognition
- Natural Language Processing
- Recommendation Systems
- Predictive Analytics`,

  'demo-2': `Cloud Computing Guide
====================

Cloud computing delivers computing services over the Internet, offering faster innovation and flexible resources.

Service Models:
- IaaS (Infrastructure as a Service): Virtual machines, storage
- PaaS (Platform as a Service): Development platforms
- SaaS (Software as a Service): Complete applications

Major Providers:
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)

Benefits:
- Scalability
- Cost Efficiency
- Global Reach
- High Availability`,

  'demo-3': `Data Science Best Practices
===========================

Data science combines statistics, mathematics, and computer science to extract insights from data.

Workflow:
1. Data Collection
2. Data Cleaning
3. Exploratory Analysis
4. Model Building
5. Evaluation
6. Deployment

Key Skills:
- Programming (Python, R)
- Statistics & Probability
- Machine Learning
- Data Visualization
- Domain Knowledge

Tools:
- Jupyter Notebooks
- Pandas & NumPy
- Scikit-learn
- TensorFlow & PyTorch`
};

