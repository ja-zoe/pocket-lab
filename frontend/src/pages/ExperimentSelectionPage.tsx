import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  Thermometer, 
  Zap, 
  Ruler, 
  Leaf, 
  Clock, 
  Users, 
  Target,
  Play,
  BookOpen
} from 'lucide-react';
import * as ExperimentData from '../data/experimentTemplates';

const ExperimentSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const categories = ['All', 'Physics', 'Chemistry', 'Environmental', 'Biology'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Physics': return <Zap className="w-5 h-5" />;
      case 'Chemistry': return <FlaskConical className="w-5 h-5" />;
      case 'Environmental': return <Leaf className="w-5 h-5" />;
      case 'Biology': return <BookOpen className="w-5 h-5" />;
      default: return <FlaskConical className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredExperiments = ExperimentData.experimentTemplates.filter(experiment => {
    const categoryMatch = selectedCategory === 'All' || experiment.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'All' || experiment.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const startExperiment = (template: ExperimentTemplate) => {
    navigate(`/experiment/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Choose Your Experiment
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Select from our curated collection of science experiments designed to teach real-world concepts through hands-on data collection.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Experiment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiments.map((experiment) => (
            <div
              key={experiment.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                    {getCategoryIcon(experiment.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {experiment.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {experiment.category}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(experiment.difficulty)}`}>
                  {experiment.difficulty}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                {experiment.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{experiment.estimatedDuration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{experiment.steps.length} steps</span>
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2 text-sm">Learning Objectives:</h4>
                <ul className="text-gray-400 text-xs space-y-1">
                  {experiment.learningObjectives.slice(0, 2).map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-teal-400 mt-1">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                  {experiment.learningObjectives.length > 2 && (
                    <li className="text-teal-400 text-xs">
                      +{experiment.learningObjectives.length - 2} more...
                    </li>
                  )}
                </ul>
              </div>

              {/* Materials */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-2 text-sm">Materials Needed:</h4>
                <div className="flex flex-wrap gap-1">
                  {experiment.materials.slice(0, 3).map((material, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                    >
                      {material}
                    </span>
                  ))}
                  {experiment.materials.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
                      +{experiment.materials.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={() => startExperiment(experiment)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Experiment
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredExperiments.length === 0 && (
          <div className="text-center py-12">
            <FlaskConical className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No experiments found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters to see more experiments.
            </p>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperimentSelectionPage;
